import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { Kind } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { z } from 'zod';
import * as forms from '@anarchitects/forms-contracts';
import * as newsletter from '@anarchitects/newsletter-contracts';
import { authOperations } from '@anarchitects/auth-contracts';
import { identityOperations } from '@anarchitects/identity-contracts';

const read = (name) =>
  JSON.parse(
    readFileSync(
      new URL(`../../baselines/legacy-3tier/${name}.json`, import.meta.url),
      'utf8',
    ),
  );
const routes = read('routes');
const fixtures = read('http');
const operations = [
  ...forms.formsOperations,
  ...newsletter.newsletterOperations,
];
const ajv = new Ajv({
  coerceTypes: 'array',
  useDefaults: true,
  removeAdditional: true,
  allErrors: false,
});
addFormats(ajv);
const route = (operation) =>
  routes.find(({ key }) => key === `${operation.method} ${operation.path}`);
const fixture = (id) => fixtures.find((item) => item.id === id);
const body = (operation) =>
  operation.requestBody.kind === 'json'
    ? operation.requestBody.content['application/json']
    : operation.requestBody.parsedSchema;
function operationFor(step) {
  const path = step.path.split('?')[0];
  return (
    operations.find((op) => op.method === step.method && op.path === path) ??
    operations.find(
      (op) =>
        op.method === step.method &&
        new RegExp(`^${op.path.replace(/\{[^}]+\}/g, '[^/]+')}$`).test(path),
    )
  );
}
// Rehydrate only the lost TypeBox Kind symbols in the frozen legacy JSON. This
// is a dev-only oracle, never an authored/runtime contract or a new DTO source.
function legacyTypeBox(schema) {
  const copy = { ...schema };
  if (copy.properties)
    copy.properties = Object.fromEntries(
      Object.entries(copy.properties).map(([key, value]) => [
        key,
        legacyTypeBox(value),
      ]),
    );
  if (copy.items) copy.items = legacyTypeBox(copy.items);
  if (copy.anyOf) copy.anyOf = copy.anyOf.map(legacyTypeBox);
  copy[Kind] =
    'const' in copy
      ? 'Literal'
      : copy.anyOf
        ? 'Union'
        : ({
            object: 'Object',
            string: 'String',
            boolean: 'Boolean',
            integer: 'Integer',
            number: 'Number',
            array: 'Array',
            null: 'Null',
          }[copy.type] ?? 'Any');
  return copy;
}
function compare(schema, validate, input, label) {
  const old = structuredClone(input);
  const valid = validate(old);
  const actual = schema.safeParse(input);
  assert.equal(
    actual.success,
    valid,
    `${label}: acceptance mismatch for ${JSON.stringify(input)}; ${JSON.stringify(actual.error?.issues)}`,
  );
  if (valid)
    assert.deepEqual(actual.data, old, `${label}: parsed-value mismatch`);
}

const samples = [
  undefined,
  null,
  true,
  false,
  0,
  1,
  -1,
  1.5,
  1e21,
  Infinity,
  -Infinity,
  '',
  ' ',
  '\n',
  '1',
  '2',
  '0x10',
  '1e2',
  'Infinity',
  '1e309',
  '1.5',
  'reader@example.test',
  'Reader@Example.test',
  'a@b.c',
  'a..b@c.test',
  ' reader@example.test',
  'true',
  'v1',
  'v2',
  '😀',
  '😀'.repeat(64),
  '😀'.repeat(65),
  '😀'.repeat(128),
  'x'.repeat(129),
  'x'.repeat(2048),
  'x'.repeat(2049),
  [],
  ['2'],
  [null],
  [false],
  ['a', 'b'],
  [['2']],
  {},
  { key: 1 },
];

test('the eight extracted routes complete the 29-operation inventory without renaming historical IDs', () => {
  assert.equal(operations.length, 8);
  const all = [...authOperations, ...identityOperations, ...operations];
  assert.equal(all.length, 29);
  assert.equal(new Set(all.map(({ operationId }) => operationId)).size, 29);
  assert.deepEqual(
    operations.map(({ method, path }) => `${method} ${path}`).sort(),
    routes
      .filter(({ path }) => /^\/(forms|newsletter)\//.test(path))
      .map(({ key }) => key)
      .sort(),
  );
  const ids = new Set(fixtures.map(({ id }) => id));
  for (const operation of operations) {
    assert.equal(operation.operationId, route(operation).operationId);
    assert.ok(operation.responses[route(operation).successStatus]);
    assert.deepEqual(operation.tags, [
      operation.domain === 'forms' ? 'Forms' : 'Newsletter',
    ]);
    assert.ok(operation.compatibility.fixtures.length);
    for (const id of [
      ...operation.compatibility.fixtures,
      ...operation.semantics.flatMap(({ fixtures }) => fixtures),
    ])
      assert.ok(ids.has(id), `${operation.operationId}: unknown fixture ${id}`);
  }
});

test('frozen Forms/Newsletter requests, serialized responses and required headers retain observed behavior', () => {
  let count = 0;
  for (const item of fixtures)
    for (const [index, step] of item.steps.entries()) {
      const operation = operationFor(step);
      if (!operation) continue;
      const old = route(operation);
      if (step.body !== undefined && old.schema.body) {
        if (operation.domain === 'forms')
          compare(
            body(operation),
            ajv.compile(old.schema.body),
            step.body,
            item.id,
          );
        else {
          const honeypot =
            operation.operationId === 'subscribeToNewsletter' &&
            typeof step.body?.website === 'string' &&
            step.body.website.length > 0;
          assert.equal(
            body(operation).safeParse(step.body).success,
            honeypot || Value.Check(legacyTypeBox(old.schema.body), step.body),
            item.id,
          );
        }
      }
      if (operation.domain === 'forms' && old.schema.querystring) {
        const query = {};
        for (const [key, value] of new URL(step.path, 'https://fixture.test')
          .searchParams)
          query[key] =
            key in query
              ? [
                  ...(Array.isArray(query[key]) ? query[key] : [query[key]]),
                  value,
                ]
              : value;
        const schema =
          operation.operationId === 'getFormDefinition'
            ? forms.FormDefinitionQuerySchema
            : forms.SubmissionsQuerySchema;
        compare(schema, ajv.compile(old.schema.querystring), query, item.id);
        const parsed = schema.safeParse(query);
        const event = item.observed.events.find(
          ({ name }) =>
            name ===
            (operation.operationId === 'getFormDefinition'
              ? 'getFormConfig'
              : 'getSubmissions'),
        );
        if (event && parsed.success) {
          if (operation.operationId === 'getFormDefinition')
            assert.equal(
              parsed.data.formVersion ?? 1,
              event.data.version,
              item.id,
            );
          else assert.deepEqual(parsed.data, event.data, item.id);
        }
      }
      const observed = item.observed.responses[index];
      const response = operation.responses[observed.status];
      assert.ok(response, `${item.id}: missing response ${observed.status}`);
      assert.deepEqual(
        response.body.content['application/json'].parse(observed.body),
        observed.body,
        item.id,
      );
      for (const header of response.headers) {
        // All frozen enabled native outcomes reached the action controller.
        assert.notEqual(
          observed.headers[header.name],
          undefined,
          `${item.id}: missing ${header.name}`,
        );
        header.schema.parse(observed.headers[header.name]);
      }
      count++;
    }
  assert.ok(count >= 50);
  console.log(`Validated ${count} frozen Forms/Newsletter HTTP responses.`);
});

test('expanded Forms body, query and path inputs match frozen AJV acceptance and mutation', () => {
  const cases = [
    [
      forms.SubmissionRequestSchema,
      route(forms.submitForm).schema.body,
      { formId: 'contact', formVersion: 1, payload: {} },
    ],
    [
      forms.FormDefinitionQuerySchema,
      route(forms.getFormDefinition).schema.querystring,
      { formVersion: 1 },
    ],
    [
      forms.SubmissionsQuerySchema,
      route(forms.getSubmissions).schema.querystring,
      { formId: 'contact', formVersion: 1 },
    ],
    [
      forms.FormIdParamsSchema,
      route(forms.getFormDefinition).schema.params,
      { formId: 'contact' },
    ],
    [
      forms.SubmissionIdParamsSchema,
      route(forms.getSubmission).schema.params,
      { submissionId: '01900000-0000-7000-8000-000000000001' },
    ],
  ];
  let count = 0;
  for (const [schema, legacy, seed] of cases) {
    const validate = ajv.compile(legacy);
    for (const value of samples) {
      compare(schema, validate, value, 'Forms root');
      count++;
      for (const key of Object.keys(seed)) {
        const input = { ...seed, [key]: value };
        if (value === undefined) delete input[key];
        compare(schema, validate, input, `Forms ${key}`);
        count++;
      }
    }
    compare(
      schema,
      validate,
      { ...seed, extra: { overflow: Infinity, nested: [null, 1] } },
      'Forms unknown values',
    );
  }
  for (const submissionId of [
    '00000000-0000-0000-0000-000000000000',
    'urn:uuid:01900000-0000-7000-8000-000000000001',
    'URN:UUID:01900000-0000-7000-8000-000000000001',
    '01900000-0000-0000-0000-000000000001\n',
  ])
    compare(
      forms.SubmissionIdParamsSchema,
      ajv.compile(route(forms.getSubmission).schema.params),
      { submissionId },
      'legacy UUID',
    );
  assert.deepEqual(forms.FormDefinitionQuerySchema.parse({}), {});
  assert.equal(
    forms.SubmissionRequestSchema.safeParse({ formId: 'contact', payload: {} })
      .success,
    false,
  );
  console.log(`Compared ${count} expanded Forms cases against AJV.`);
});

test('Newsletter preserves strict TypeBox acceptance and UTF-16 lengths independently of Forms', () => {
  let count = 0;
  for (const [schema, operation, seed] of [
    [
      newsletter.NewsletterSubscriptionRequestSchema,
      newsletter.subscribeToNewsletter,
      {
        email: 'Reader@Example.test',
        consent: true,
        consentVersion: 'v1',
        source: '',
        website: '',
      },
    ],
    [
      newsletter.NewsletterNativeActionRequestSchema,
      newsletter.confirmNewsletterSubscription,
      { token: 'token' },
    ],
  ]) {
    const legacy = legacyTypeBox(route(operation).schema.body);
    for (const value of samples) {
      compare(
        schema,
        (input) => Value.Check(legacy, input),
        value,
        'Newsletter root',
      );
      count++;
      for (const key of Object.keys(seed)) {
        const input = { ...seed, [key]: value };
        if (value === undefined) delete input[key];
        compare(
          schema,
          (input) => Value.Check(legacy, input),
          input,
          `Newsletter ${key}`,
        );
        count++;
      }
    }
    assert.equal(schema.safeParse({ ...seed, extra: true }).success, false);
  }
  assert.equal(
    newsletter.NewsletterNativeActionRequestSchema.safeParse({
      token: '😀'.repeat(65),
    }).success,
    false,
  );
  assert.equal(
    newsletter.NewsletterNativeActionRequestSchema.safeParse({ token: '' })
      .success,
    true,
  );
  assert.equal(
    newsletter.NewsletterSubscriptionRequestSchema.parse({
      email: 'Reader@Example.test',
      consent: true,
      consentVersion: 'v1',
    }).email,
    'Reader@Example.test',
  );
  console.log(`Compared ${count} expanded Newsletter cases against TypeBox.`);
});

test('honeypot acceptance is explicit and precedes validation, limiting and side effects', () => {
  for (const website of [' ', 'bot', 'x'.repeat(2049)]) {
    const input = {
      website,
      email: 123,
      consent: false,
      extra: { nested: null },
    };
    assert.deepEqual(
      newsletter.NewsletterSubscribeRequestSchema.parse(input),
      input,
    );
    assert.equal(
      newsletter.NewsletterSubscriptionRequestSchema.safeParse(input).success,
      false,
    );
  }
  assert.equal(
    newsletter.NewsletterSubscribeRequestSchema.safeParse({ website: '' })
      .success,
    false,
  );
  for (const id of [
    'newsletter-honeypot-bypasses-invalid-body',
    'newsletter-honeypot-bypasses-limiter',
  ])
    assert.deepEqual(fixture(id).observed.events, []);
  assert.equal(
    newsletter.subscribeToNewsletter.semantics[0].id,
    'newsletter.honeypot',
  );
});

test('Forms security findings remain blocked and application behavior is not silently replaced', () => {
  assert.deepEqual(
    forms.formsReleaseBlockers.map(({ id }) => id),
    ['D05', 'D08'],
  );
  for (const operation of forms.formsOperations)
    assert.equal(operation.security.kind, 'profile');
  assert.ok(forms.formsProfiles.protected.unresolved);
  for (const id of [
    'forms-submit-missing-required-dynamic-field',
    'forms-submit-invalid-dynamic-email',
    'forms-submit-unknown-payload-property',
  ]) {
    const item = fixture(id);
    assert.deepEqual(
      forms.SubmissionRequestSchema.parse(item.steps[0].body),
      item.observed.events.find(({ name }) => name === 'createSubmission').data,
    );
  }
  const exposed = fixture('forms-definition-delivery-secret').observed
    .responses[0].body;
  assert.equal(
    forms.FormDefinitionEnvelopeResponseSchema.parse(exposed).config.delivery
      .webhooks[0].secret,
    'public-fixture-webhook-secret',
  );
  const stale = fixture('newsletter-stale-consent');
  assert.ok(
    newsletter.NewsletterSubscribeRequestSchema.safeParse(stale.steps[0].body)
      .success,
  );
  assert.equal(stale.observed.responses[0].status, 400);
  assert.deepEqual(
    fixture('newsletter-provider-failure-keeps-grant').observed.events.map(
      ({ name }) => name,
    ),
    ['appendGrant', 'subscribe'],
  );
});

test('webhook metadata preserves signed bytes, failure ordering and conditional route availability', () => {
  const operation = newsletter.receiveNewsletterWebhook;
  assert.equal(operation.requestBody.kind, 'raw');
  assert.equal(
    operation.requestBody.parsedSchema,
    newsletter.NewsletterWebhookPayloadSchema,
  );
  assert.equal(operation.parameters[0].name, 'signature');
  assert.equal(operation.security.kind, 'profile');
  for (const status of [200, 400, 401, 413, 503, 404])
    assert.ok(operation.responses[status]);
  const valid = fixture('newsletter-webhook-valid').steps[0].rawBody;
  assert.deepEqual(
    newsletter.NewsletterWebhookPayloadSchema.parse(JSON.parse(valid)),
    JSON.parse(valid),
  );
  assert.notEqual(JSON.stringify(JSON.parse(valid)), valid);
  for (const id of [
    'newsletter-webhook-changed-signed-bytes',
    'newsletter-webhook-missing-signature',
    'newsletter-webhook-wrong-account',
    'newsletter-webhook-no-raw-body',
    'newsletter-webhook-size-limit',
  ])
    assert.deepEqual(fixture(id).observed.events, []);
  assert.deepEqual(
    fixture('newsletter-webhook-duplicate').observed.responses.map(
      ({ body }) => body,
    ),
    [
      { recorded: 1, duplicates: 0 },
      { recorded: 0, duplicates: 1 },
    ],
  );
  for (const id of [
    'newsletter-confirm-get-not-supported',
    'newsletter-unsubscribe-get-not-supported',
  ]) {
    assert.equal(operationFor(fixture(id).steps[0]), undefined);
    assert.deepEqual(fixture(id).observed.events, []);
  }
});

test('generation gaps are visible instead of treating schema conversion as equivalence', () => {
  for (const schema of [
    forms.SubmissionRequestSchema,
    newsletter.NewsletterSubscribeRequestSchema,
    newsletter.NewsletterWebhookPayloadSchema,
  ])
    assert.throws(
      () => z.toJSONSchema(schema, { io: 'input', unrepresentable: 'throw' }),
      /cannot be represented/,
    );
  const projected = z.toJSONSchema(
    newsletter.NewsletterNativeActionRequestSchema,
    { io: 'input', target: 'draft-2020-12' },
  );
  const validator = new Ajv2020().compile(projected);
  const input = { token: '😀'.repeat(65) };
  assert.equal(validator(input), true); // JSON Schema counts code points.
  assert.equal(
    newsletter.NewsletterNativeActionRequestSchema.safeParse(input).success,
    false,
  ); // Legacy counts UTF-16.
  for (const schema of [
    forms.FormDefinitionEnvelopeResponseSchema,
    forms.SubmissionResponseSchema,
    newsletter.NewsletterAcceptedResponseSchema,
    newsletter.NewsletterWebhookResponseSchema,
  ])
    assert.ok(
      z.toJSONSchema(schema, { io: 'output', unrepresentable: 'throw' }),
    );
});

test('supplemental pinned HTTP probes validate webhook branches, Unicode limits and transport/application separation', async () => {
  const { legacy6Cases } = await import('./legacy6-cases.mjs');
  const snapshot = JSON.parse(
    readFileSync(
      new URL(
        '../../packages/newsletter/compatibility/legacy-http.json',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  assert.equal(snapshot.revision, 'ecda1b6e0d9bc39c66373452a92dce91e06abee0');
  assert.deepEqual(
    snapshot.cases.map(({ observed: _observed, ...input }) => input),
    legacy6Cases,
  );
  assert.equal(Object.keys(snapshot.sourceHashes).length, 4);
  for (const value of Object.values(snapshot.sourceHashes))
    assert.match(value, /^[a-f0-9]{64}$/);
  for (const item of snapshot.cases) {
    const step = item.steps[0],
      observed = item.observed.responses[0],
      operation = operationFor(step);
    assert.ok(operation, item.id);
    const contract = operation.responses[observed.status];
    assert.deepEqual(
      contract.body.content['application/json'].parse(observed.body),
      observed.body,
      item.id,
    );
    if (item.id.startsWith('si6-webhook-')) {
      const parsed = newsletter.NewsletterWebhookPayloadSchema.safeParse(
        step.body,
      );
      const policyDenial =
        item.id === 'si6-webhook-wrong-account-unknown-event';
      assert.equal(
        parsed.success,
        observed.status === 200 || policyDenial,
        item.id,
      );
      if (parsed.success) assert.deepEqual(parsed.data, step.body);
      if (observed.status !== 200)
        assert.deepEqual(item.observed.events, [], item.id);
    } else if (step.body) {
      const parsed = body(operation).safeParse(step.body);
      if (item.id === 'si6-forms-string-infinity') {
        assert.equal(parsed.data.formVersion, Infinity);
        assert.equal(observed.status, 500); // accepted input fails later serialization
      } else assert.equal(parsed.success, observed.status === 202, item.id);
    }
    if (item.id === 'si6-native-malformed-json') {
      assert.equal(observed.headers['cache-control'], undefined);
      assert.equal(observed.headers['referrer-policy'], undefined);
    }
  }
});
