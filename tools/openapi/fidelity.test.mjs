import assert from 'node:assert/strict';
import { test } from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { loadDomains } from './model.mjs';
import { generate, reviewProfile } from './generate.mjs';
import { readJson } from './common.mjs';
import { legacy6Cases } from '../contract-authoring/legacy6-cases.mjs';

const models = await loadDomains(),
  proposal = readJson('tools/openapi/projection-proposal.json');
const result = await generate(models, {
  profile: reviewProfile(models),
  proposal,
  review: true,
});
const ajv = new Ajv2020({
  strict: false,
  strictNumbers: true,
  allErrors: true,
});
addFormats(ajv);
ajv.addSchema({ ...result.document, $id: 'urn:contracts:fidelity' });
const input = (operationId) =>
  ajv.compile({
    $ref:
      'urn:contracts:fidelity' +
      result.inventory.operations.find(
        (op) => op.definition.operationId === operationId,
      ).definition.requestBody.content['application/json'].schema.$ref,
  });

test('UTF-16 constraints exactly preserve BMP, supplementary, mixed, line-break and lone-surrogate boundaries', () => {
  const check = input('confirmNewsletterSubscription');
  const canonical =
    models[3].schemas['newsletter.NewsletterNativeActionRequest'];
  for (const character of ['a', '😀', '\ud800', '\udfff', '\n', 'a😀', '😀\n'])
    for (const count of [0, 1, 42, 43, 63, 64, 65, 127, 128, 129]) {
      const value = { token: character.repeat(count) };
      assert.equal(
        check(value),
        canonical.safeParse(value).success,
        `${JSON.stringify(character)} × ${count}`,
      );
    }
  const subscribe = input('subscribeToNewsletter');
  const schema = models[3].schemas['newsletter.NewsletterSubscribeRequest'];
  for (const character of ['a', '😀', '\ud800', '\n'])
    for (const count of [
      126, 127, 250, 251, 254, 255, 1023, 1024, 1025, 2048, 2049,
    ]) {
      for (const field of ['email', 'source', 'website']) {
        const value = {
          email: 'a@b.c',
          consent: true,
          consentVersion: 'v1',
          [field]: character.repeat(count) + (field === 'email' ? '@b.c' : ''),
        };
        assert.equal(
          subscribe(value),
          schema.safeParse(value).success,
          `${field}: ${JSON.stringify(character)} × ${count}`,
        );
      }
    }
  assert.equal(
    subscribe({ website: '😀'.repeat(3000) }),
    true,
    'Honeypot precedence is retained',
  );
});

test('string and singleton preimages retain positive/negative constraints and canonical parsed output', () => {
  const check = input('login'),
    canonical = models[0].schemas['auth.LoginRequest'];
  for (const password of [
    '',
    'x',
    '12345',
    '123456',
    '😀😀😀😀😀😀',
    null,
    false,
    true,
  ]) {
    for (const value of [password, [password]]) {
      const body = { credential: 'reader', password: value };
      assert.equal(
        check(body),
        canonical.safeParse(body).success,
        JSON.stringify(value),
      );
    }
  }
  const valid = { credential: ['reader'], password: 123456 };
  assert.equal(check(valid), true);
  assert.deepEqual(canonical.parse(valid), {
    credential: 'reader',
    password: '123456',
  });
  const postCoercion = { credential: 'reader', password: 1 };
  assert.equal(check(postCoercion), true);
  assert.equal(
    canonical.safeParse(postCoercion).success,
    false,
    'Numeric stringification remains disclosed',
  );
  const overflow = JSON.parse('{"credential":"reader","password":1e309}');
  assert.equal(check(overflow), false);
  assert.equal(
    canonical.parse(overflow).password,
    'Infinity',
    'Decoded overflow remains disclosed',
  );
  assert.equal(
    check({ credential: 'reader', password: {} }),
    false,
    'No arbitrary-value fallback',
  );
});

test('webhook portable conditionals are enforced; arbitrary alias equality and Date.parse remain bounded exceptions', () => {
  const check = input('receiveNewsletterWebhook');
  const canonical = models[3].schemas['newsletter.NewsletterWebhookPayload'];
  const exceptions = new Set([
    'si6-webhook-invalid-timestamp',
    'si6-webhook-conflicting-name',
  ]);
  for (const fixture of legacy6Cases.filter((item) =>
    item.id.startsWith('si6-webhook-'),
  )) {
    const body = fixture.steps[0].body;
    const native = canonical.safeParse(body).success;
    if (exceptions.has(fixture.id)) {
      assert.equal(native, false, fixture.id);
      assert.equal(check(body), true, fixture.id);
    } else assert.equal(check(body), native, fixture.id);
  }
  for (const body of [
    {},
    { event: ' ' },
    { event: 'subscriber.unsubscribed' },
    { event: 'subscriber.created', events: null },
  ])
    assert.equal(check(body), false);
});

test('every reused operation/component/IO review is enforced with source and generator pins', async () => {
  for (const mutate of [
    (r) => {
      r.status = 'draft';
    },
    (r) => {
      r.entries.push(...structuredClone(r.entries));
    },
    (r) => {
      r.entries.forEach((e) => {
        e.status = 'draft';
      });
    },
    (r) => {
      r.entries.forEach((e) => {
        e.sourceDigest = '0'.repeat(64);
      });
    },
    (r) => {
      r.entries.forEach((e) => {
        e.generatorDigest = '0'.repeat(64);
      });
    },
    (r) => {
      r.entries.forEach((e) => {
        e.operationId = 'not-approved';
      });
    },
    (r) => {
      r.entries.forEach((e) => {
        e.component += '.changed';
      });
    },
    (r) => {
      r.entries.forEach((e) => {
        e.io = e.io === 'input' ? 'output' : 'input';
      });
    },
    (r) => {
      r.entries.forEach((e) => {
        e.owner = '';
      });
    },
    (r) => {
      r.entries.forEach((e) => {
        e.evidence = [];
      });
    },
    (r) => {
      r.entries.forEach((e) => {
        e.limitations.push({ kind: 'unreviewed' });
      });
    },
  ]) {
    const changed = structuredClone(proposal);
    mutate(changed);
    await assert.rejects(
      generate(models, {
        profile: reviewProfile(models),
        proposal: changed,
        review: true,
      }),
    );
  }
  // Confirm then unsubscribe share a component. Removing only the second review
  // must still fail, even though conversion already populated the component cache.
  const changed = structuredClone(proposal);
  changed.entries = changed.entries.filter(
    (entry) => entry.operationId !== 'unsubscribeFromNewsletter',
  );
  await assert.rejects(
    generate(models, {
      profile: reviewProfile(models),
      proposal: changed,
      review: true,
    }),
    /unsubscribeFromNewsletter.*no scoped projection review/,
  );
});

test('D08 public target rejects delivery secrets while the frozen legacy evidence remains reproducible', async () => {
  const forms = await import('@anarchitects/forms-contracts');
  const fixture = readJson('baselines/legacy-3tier/http.json').find(
    (item) => item.id === 'forms-definition-delivery-secret',
  );
  const exposed = fixture.observed.responses[0].body;
  assert.equal(
    forms.FormDefinitionEnvelopeResponseSchema.safeParse(exposed).success,
    true,
  );
  assert.equal(
    forms.PublicFormDefinitionEnvelopeResponseSchema.safeParse(exposed).success,
    false,
  );
  const safe = structuredClone(exposed);
  delete safe.config.delivery;
  assert.deepEqual(
    forms.PublicFormDefinitionEnvelopeResponseSchema.parse(safe),
    safe,
  );
  for (const field of ['secret', 'url', 'webhooks', 'delivery'])
    assert.equal(
      forms.FormDeliveryStatusSchema.safeParse({
        configured: true,
        [field]: 'test-only',
      }).success,
      false,
    );
});
