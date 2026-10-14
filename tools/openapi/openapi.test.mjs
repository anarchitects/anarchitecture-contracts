import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import YAML from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { loadDomains, schemaIndex, project } from './model.mjs';
import { syntheticProfile } from './fixtures/synthetic-profile.mjs';
import { generate, reviewProfile } from './generate.mjs';
import { validateRegistry, lintDocument } from './validate.mjs';
import {
  diffContracts,
  requiredBump,
  validateReleaseVersion,
  compareLegacy,
} from './compatibility.mjs';
import { readJson, json, digest } from './common.mjs';

const models = await loadDomains();
const proposal = readJson('tools/openapi/projection-proposal.json');
const result = await generate(models, {
  profile: reviewProfile(models),
  proposal,
  review: true,
});
const clone = (value) =>
  value?._zod
    ? value
    : Array.isArray(value)
      ? value.map(clone)
      : value && typeof value === 'object'
        ? Object.fromEntries(
            Object.entries(value).map(([key, child]) => [key, clone(child)]),
          )
        : value;

test('all 29 operations have deterministic snapshots, exact origins and JSON/YAML parity', async () => {
  assert.equal(result.manifest.operationCount, 29);
  assert.equal(result.manifest.documentedOperationCount, 14);
  assert.equal(result.manifest.excludedOperations.length, 15);
  assert.deepEqual(result.manifest.supportedCapabilities, []);
  assert.deepEqual(YAML.parse(result.yamlText), JSON.parse(result.jsonText));
  assert.equal(
    readFileSync('generated/openapi/aggregate-review.json', 'utf8'),
    result.jsonText,
  );
  assert.equal(
    readFileSync('generated/openapi/aggregate-review.yaml', 'utf8'),
    result.yamlText,
  );
  const reversed = models.toReversed().map((model) => ({
    ...model,
    operations: model.operations.toReversed(),
    schemas: Object.fromEntries(Object.entries(model.schemas).toReversed()),
  }));
  const again = await generate(reversed, {
    profile: reviewProfile(reversed),
    proposal,
    review: true,
  });
  assert.equal(again.jsonText, result.jsonText);
  assert.equal(again.yamlText, result.yamlText);
  assert.equal(json(again.manifest), json(result.manifest));
  for (const [name, origin] of Object.entries(result.manifest.schemaOrigins)) {
    assert.ok(name.startsWith(`${origin.domain}.`));
    assert.ok(result.manifest.packages[origin.package]);
    assert.ok(['input', 'output'].includes(origin.io));
  }
});

test('registry rejects malformed metadata and security without weakening valid definitions', () => {
  const mutations = [
    [
      'duplicate ID',
      (m) => {
        m[0].operations[1].operationId = m[0].operations[0].operationId;
      },
    ],
    [
      'duplicate route',
      (m) => {
        m[0].operations[1].path = m[0].operations[0].path;
        m[0].operations[1].method = m[0].operations[0].method;
      },
    ],
    [
      'missing tag',
      (m) => {
        m[0].operations[0].tags = [];
      },
    ],
    [
      'missing security',
      (m) => {
        delete m[0].operations[0].security;
      },
    ],
    [
      'anonymous alternative',
      (m) => {
        m[0].operations[0].security = { kind: 'required', alternatives: [{}] };
      },
    ],
    [
      'missing errors',
      (m) => {
        m[0].operations[0].responses = {
          200: m[0].operations[0].responses['200'],
        };
      },
    ],
    [
      'invalid status',
      (m) => {
        m[0].operations[0].responses.default =
          m[0].operations[0].responses['200'];
      },
    ],
    [
      'bodyless status',
      (m) => {
        m[0].operations[0].responses['204'] =
          m[0].operations[0].responses['200'];
      },
    ],
    [
      'unregistered schema',
      (m) => {
        m[0].operations[0].requestBody = {
          kind: 'json',
          required: true,
          content: { 'application/json': z.string() },
        };
      },
    ],
    [
      'path mismatch',
      (m) => {
        m[0].operations[0].path = '/auth/{missing}';
      },
    ],
    [
      'unknown semantics',
      (m) => {
        m[0].operations[0].responses['200'].semantics = ['missing'];
      },
    ],
    [
      'missing header presence',
      (m) => {
        const r = m[0].operations.find((o) => o.responses['200'].headers.length)
          .responses['200'];
        delete r.headers[0].presence;
      },
    ],
    [
      'joined cookies',
      (m) => {
        const r = m[0].operations.find((o) => o.responses['200'].headers.length)
          .responses['200'];
        r.headers[0].cardinality = 'single';
      },
    ],
    [
      'header collision',
      (m) => {
        const r = m[0].operations.find((o) => o.responses['200'].headers.length)
          .responses['200'];
        r.headers.push({ ...r.headers[0], name: 'Set-Cookie' });
      },
    ],
    [
      'wrong owner',
      (m) => {
        m[0].operations[0].domain = 'forms';
      },
    ],
    [
      'missing compatibility',
      (m) => {
        delete m[0].operations[0].compatibility;
      },
    ],
    [
      'unknown availability',
      (m) => {
        m[0].operations[0].availability = { kind: 'maybe' };
      },
    ],
  ];
  for (const [label, mutate] of mutations) {
    const changed = clone(models);
    mutate(changed);
    assert.throws(
      () => validateRegistry(changed, schemaIndex(changed)),
      undefined,
      label,
    );
  }
});

test('unrepresentable constructs, omitted refinements and unapproved proposals fail closed', () => {
  const origin = {
    id: 'newsletter.NewsletterNativeActionRequest',
    domain: 'newsletter',
  };
  for (const schema of [
    z.custom(() => true),
    z.string().refine((value) => value !== 'x'),
    z
      .string()
      .transform((value) => value.length)
      .pipe(z.number().min(3)),
    z.date(),
    z.coerce.number().positive(),
    z.string().trim(),
  ]) {
    assert.throws(() =>
      project(
        schema,
        'input',
        origin,
        proposal,
        digest(json(models[3].sourceFiles)),
      ),
    );
    assert.throws(() =>
      project(
        schema,
        'input',
        origin,
        proposal,
        digest(json(models[3].sourceFiles)),
        true,
      ),
    );
  }
  const schema = models[3].schemas['newsletter.NewsletterNativeActionRequest'];
  assert.throws(
    () =>
      project(schema, 'input', origin, proposal, 'changed-source', true, {
        operationId: 'confirmNewsletterSubscription',
      }),
    /source bytes/,
  );
});

const validator = () => {
  const ajv = new Ajv2020({
    strict: false,
    strictNumbers: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema({ ...result.document, $id: 'urn:contracts:review' });
  return (ref) => ajv.compile({ $ref: `urn:contracts:review${ref}` });
};

test('proposal has executable counterexamples: projection is never represented as equivalence', () => {
  const validate = validator();
  const native = result.inventory.operations.find(
    (op) => op.definition.operationId === 'confirmNewsletterSubscription',
  );
  const nativeSchema =
    native.definition.requestBody.content['application/json'].schema;
  const nonBmp = { token: '😀'.repeat(65) };
  assert.equal(validate(nativeSchema.$ref)(nonBmp), false);
  assert.equal(
    models[3].schemas['newsletter.NewsletterNativeActionRequest'].safeParse(
      nonBmp,
    ).success,
    false,
  );
  const login = result.inventory.operations.find(
    (op) => op.definition.operationId === 'login',
  );
  const weakPassword = { credential: 'reader@example.test', password: 1 };
  assert.equal(
    validate(
      login.definition.requestBody.content['application/json'].schema.$ref,
    )(weakPassword),
    true,
  );
  assert.equal(
    models[0].schemas['auth.LoginRequest'].safeParse(weakPassword).success,
    false,
  );
  const webhook = result.inventory.operations.find(
    (op) => op.definition.operationId === 'receiveNewsletterWebhook',
  );
  const invalid = {
    event: 'subscriber.created',
    type: 'a-different-unhandled-event',
  };
  assert.equal(
    validate(
      webhook.definition.requestBody.content['application/json'].schema.$ref,
    )(invalid),
    true,
  );
  assert.equal(
    models[3].schemas['newsletter.NewsletterWebhookPayload'].safeParse(invalid)
      .success,
    false,
  );
  for (const operation of [login, webhook]) {
    const name = operation.definition.requestBody.content[
      'application/json'
    ].schema.$ref
      .split('/')
      .at(-1);
    assert.equal(
      result.document.components.schemas[name]['x-contract-projection'].status,
      'reviewed-exception',
    );
  }
});

test('generated output schemas validate every matching frozen HTTP response and header', () => {
  const validate = validator();
  let count = 0,
    headers = 0;
  for (const fixture of readJson('baselines/legacy-3tier/http.json'))
    for (const [i, step] of fixture.steps.entries()) {
      const operation = result.inventory.operations
        .toSorted(
          (a, b) =>
            (a.path.match(/\{/g)?.length ?? 0) -
            (b.path.match(/\{/g)?.length ?? 0),
        )
        .find(
          (op) =>
            op.method === step.method &&
            new RegExp(`^${op.path.replace(/\{[^}]+\}/g, '[^/]+')}$`).test(
              step.path.split('?')[0],
            ),
        );
      if (!operation) continue;
      const response = fixture.observed.responses[i];
      const declared = operation.definition.responses[response.status];
      assert.ok(declared, `${fixture.id}: undocumented ${response.status}`);
      if (declared.content) {
        const check = validate(
          declared.content['application/json'].schema.$ref,
        );
        assert.equal(
          check(response.body),
          true,
          `${fixture.id}: ${JSON.stringify(check.errors)}`,
        );
        count++;
      }
      for (const [name, header] of Object.entries(declared.headers))
        if (response.headers[name] !== undefined) {
          const values =
            header['x-contract-cardinality'] === 'repeated'
              ? response.headers[name]
              : [response.headers[name]];
          for (const value of values) {
            assert.equal(
              validate(header.schema.$ref)(value),
              true,
              `${fixture.id}: ${name}`,
            );
            headers++;
          }
        }
    }
  assert.ok(count >= 120, `Only ${count} frozen responses checked`);
  assert.ok(headers > 10);
});

test('protected routes never default to anonymous; disabled routes are omitted; raw bytes remain normative', async () => {
  for (const item of Object.values(result.document.paths))
    for (const operation of Object.values(item))
      assert.deepEqual(operation.security, []);
  assert.ok(
    result.inventory.operations.some((op) => op.security.kind === 'profile'),
  );
  const profile = reviewProfile(models);
  profile.securitySchemes = {
    session: {
      type: 'apiKey',
      in: 'cookie',
      name: 'test-session',
      description: 'Unit test only, not a deployment profile.',
    },
    signature: { type: 'apiKey', in: 'header', name: 'signature' },
  };
  profile.securityBindings = Object.fromEntries(
    [
      'auth.protected',
      'forms.protected',
      'identity.protected',
      'newsletter.webhook-signature',
    ].map((binding) => [
      binding,
      [{ [binding.startsWith('newsletter') ? 'signature' : 'session']: [] }],
    ]),
  );
  const resolvedForTest = await generate(models, {
    profile,
    proposal,
    review: true,
  });
  assert.equal(resolvedForTest.manifest.documentedOperationCount, 29);
  const webhook = resolvedForTest.document.paths['/newsletter/webhook'].post;
  assert.deepEqual(webhook.security, [{ signature: [] }]);
  assert.equal(
    webhook.requestBody['x-contract-raw-body'].preserveExactBytes,
    true,
  );
  assert.equal(webhook.parameters[0].required, true);
  profile.securityBindings['auth.protected'] = [{}];
  await assert.rejects(
    generate(models, { profile, proposal, review: true }),
    /Anonymous/,
  );
  profile.securityBindings['auth.protected'] = [];
  await assert.rejects(
    generate(models, { profile, proposal, review: true }),
    /nonempty/,
  );
  const disabled = { ...reviewProfile(models), capabilities: ['auth.jwt'] };
  const subset = await generate(models, {
    profile: disabled,
    proposal,
    review: true,
  });
  assert.equal(subset.manifest.documentedOperationCount, 3);
  assert.ok(!subset.document.paths['/newsletter/confirm']);
  await assert.rejects(
    generate(models, { profile: reviewProfile(models), proposal }),
    /approved profile/,
  );
  const approved = {
    ...reviewProfile(models),
    status: 'approved',
    approval: { owner: 'test only', decision: 'unit-test' },
  };
  await assert.rejects(
    generate(models, { profile: approved, proposal }),
    /Unresolved host/,
  );
  approved.hostBindings = Object.fromEntries(
    result.manifest.unresolvedHostBindings.map((key) => [
      key,
      { description: 'Unit test only', evidence: 'fixture' },
    ]),
  );
  await assert.rejects(
    generate(models, { profile: approved, proposal }),
    /Blocked capabilities: D05, D08/,
  );
  const nativeModel = models[3];
  const nativeProfile = { ...approved, capabilities: ['newsletter.native'] };
  await assert.rejects(
    generate([nativeModel], { profile: nativeProfile, proposal }),
    /Unresolved host|variants|configurationPointer|invalid/i,
  );
});

test('resolved generation succeeds for representable schemas and explicit bindings; linter rejects broken references', async () => {
  const request = z.strictObject({ token: z.string().regex(/^[a-z]+$/) });
  const base = models[3];
  const operation = {
    ...base.operations[1],
    requestBody: {
      kind: 'json',
      required: true,
      content: { 'application/json': request },
    },
  };
  const model = {
    ...base,
    schemas: { ...base.schemas, 'newsletter.TestOnlyRequest': request },
    operations: [operation],
    profiles: {
      fixture: { capabilities: [operation.capability], requiredBindings: [] },
    },
    blockers: [],
  };
  const profile = syntheticProfile([model]);
  const clean = await generate([model], {
    profile,
    proposal,
    verification: true,
  });
  assert.equal(clean.manifest.status, 'test-only');
  assert.deepEqual(clean.manifest.supportedCapabilities, []);
  assert.deepEqual(clean.manifest.projections, {});
  const bad = structuredClone(clean.document);
  bad.paths['/newsletter/confirm'].post.requestBody.content[
    'application/json'
  ].schema.$ref = '#/components/schemas/missing';
  await assert.rejects(lintDocument(bad), /Dangling/);
  bad.paths['/newsletter/confirm'].post.requestBody.content[
    'application/json'
  ].schema.$ref = 'https://example.test/schema';
  await assert.rejects(lintDocument(bad), /External/);
});

test('compatibility gates classify changes conservatively in both directions and enforce SemVer/migrations', () => {
  const before = { inventory: result.inventory, manifest: result.manifest };
  assert.deepEqual(diffContracts(before, before), []);
  for (const mutate of [
    (value) => {
      value.inventory.operations[0].definition.operationId = 'renamed';
    },
    (value) => {
      value.inventory.operations[0].security = {
        kind: 'required',
        alternatives: [{ changed: [] }],
      };
    },
    (value) => {
      delete value.inventory.operations[0].definition.responses['400'];
    },
    (value) => {
      value.inventory.operations[0].definition.parameters.push({
        name: 'required',
        required: true,
      });
    },
    (value) => {
      value.inventory.schemas[
        Object.keys(value.inventory.schemas)[0]
      ].additionalProperties = true;
    },
    (value) => {
      value.manifest.profile.hostBindings.changed = 'weakened';
    },
    (value) => {
      value.manifest.capabilityBlockers = [];
    },
    (value) => {
      value.manifest.projectionReviews = {};
    },
    (value) => {
      value.manifest.status = 'resolved';
    },
  ]) {
    const after = structuredClone(before);
    mutate(after);
    const findings = diffContracts(before, after);
    assert.ok(findings.some((finding) => finding.impact === 'breaking'));
    assert.equal(requiredBump('1.2.3', findings), 'major');
    assert.equal(requiredBump('0.1.0', findings), 'minor');
    assert.throws(
      () =>
        validateReleaseVersion({
          name: 'test',
          version: '0.1.0',
          nextVersion: '0.2.0',
          findings,
        }),
      /reviewed migration/,
    );
    const migration = {
      package: 'test',
      status: 'approved',
      baseRevision: 'base',
      findingsDigest: digest(json(findings)),
      owner: 'test',
      decision: 'test',
      consumerMigration: 'test',
      rollback: 'test',
    };
    validateReleaseVersion({
      name: 'test',
      version: '0.1.0',
      nextVersion: '0.2.0',
      findings,
      baseRevision: 'base',
      migration,
    });
    assert.throws(
      () =>
        validateReleaseVersion({
          name: 'test',
          version: '1.2.3',
          nextVersion: '1.2.3',
          findings,
          baseRevision: 'base',
          migration,
        }),
      /major release/,
    );
  }
  assert.throws(
    () =>
      validateReleaseVersion({
        name: 'test',
        version: '0.0.0',
        nextVersion: '0.0.0',
        findings: [{ impact: 'minor' }],
      }),
    /patch release/,
  );
  const added = structuredClone(before);
  added.inventory.operations.push({
    ...added.inventory.operations[0],
    definition: {
      ...added.inventory.operations[0].definition,
      operationId: 'newOperation',
    },
  });
  assert.equal(requiredBump('1.0.0', diffContracts(before, added)), 'minor');
});

test('compatibility minima follow zero-major Nx semantics without waiving breaking review', () => {
  for (const [version, impact, bump, nextVersion] of [
    ['0.0.1', 'minor', 'patch', '0.0.2'],
    ['0.2.3', 'minor', 'patch', '0.2.4'],
    ['0.2.3', 'patch', 'patch', '0.2.4'],
    ['1.2.3', 'minor', 'minor', '1.3.0'],
    ['1.2.3', 'patch', 'patch', '1.2.4'],
  ]) {
    const findings = [{ impact }];
    assert.equal(requiredBump(version, findings), bump);
    validateReleaseVersion({ name: 'test', version, findings, nextVersion });
    assert.throws(
      () =>
        validateReleaseVersion({
          name: 'test',
          version,
          findings,
          nextVersion: version,
        }),
      /requires a .* release/,
    );
  }
  const findings = [{ impact: 'breaking' }];
  assert.equal(requiredBump('0.2.3', findings), 'minor');
  assert.equal(requiredBump('1.2.3', findings), 'major');
  assert.throws(
    () =>
      validateReleaseVersion({
        name: 'test',
        version: '0.2.3',
        findings,
        nextVersion: '0.2.4',
      }),
    /minor release/,
  );
  assert.throws(
    () =>
      validateReleaseVersion({
        name: 'test',
        version: '0.2.3',
        findings,
        nextVersion: '0.3.0',
      }),
    /reviewed migration/,
  );
});

test('migration approvals match one exact baseline and findings in legacy or multi-record files', () => {
  const findings = [
    { impact: 'breaking', reason: 'projection provenance changed' },
  ];
  const review = {
    package: 'test',
    status: 'approved',
    baseRevision: 'pr-base',
    findingsDigest: digest(json(findings)),
    owner: 'maintainer',
    decision: 'review',
    consumerMigration: 'retain existing wire behavior',
    rollback: 'preserve immutable releases',
  };
  const releaseReview = { ...review, baseRevision: 'release-base' };
  const validate = (migration, overrides = {}) =>
    validateReleaseVersion({
      name: 'test',
      version: '0.0.1',
      nextVersion: '0.1.0',
      findings,
      baseRevision: 'pr-base',
      migration,
      ...overrides,
    });
  validate(review);
  validate([review, releaseReview]);
  validate([review, releaseReview], { baseRevision: 'release-base' });
  for (const migration of [
    null,
    [],
    [releaseReview],
    [review, { ...review }],
    [review, { ...review, status: 'draft' }],
    ...Object.entries({
      package: 'another-package',
      baseRevision: 'stale-base',
      findingsDigest: 'stale-findings',
      status: 'draft',
      owner: '',
      decision: '',
      consumerMigration: '',
      rollback: '',
    }).map(([key, value]) => [releaseReview, { ...review, [key]: value }]),
  ]) {
    assert.throws(() => validate(migration), /reviewed migration/);
  }
  assert.throws(
    () =>
      validate([review, releaseReview], {
        findings: [...findings, { impact: 'breaking', reason: 'new change' }],
      }),
    /reviewed migration/,
  );
  assert.throws(
    () => validate([review, releaseReview], { nextVersion: '0.0.2' }),
    /minor release/,
  );
});

test('frozen baseline comparison rejects route/ID/status drift and retains explicit discrepancy evidence', () => {
  const baseline = readJson('baselines/legacy-3tier/routes.json');
  const document = readJson('baselines/legacy-3tier/regenerated-openapi.json');
  const report = compareLegacy(models, baseline, document, [result.inventory]);
  assert.equal(report.length, 29);
  assert.equal(
    report.filter((row) => row.disposition.startsWith('D01')).length,
    3,
  );
  const changed = clone(models);
  changed[0].operations[0].operationId = 'newName';
  assert.throws(
    () => compareLegacy(changed, baseline, document, [result.inventory]),
    /operationId/,
  );
});
