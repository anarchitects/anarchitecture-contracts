import assert from 'node:assert/strict';
import { test } from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import YAML from 'yaml';
import { DefaultAuthContractConfig } from '@anarchitects/auth-contracts';
import { configureAuthModels } from './auth-configuration.mjs';
import { loadDomains } from './model.mjs';
import { candidates } from './review-candidates.mjs';
import { generate, reviewProfile } from './generate.mjs';
import { readJson } from './common.mjs';
import {
  syntheticProfile,
  sealSynthetic,
} from './fixtures/synthetic-profile.mjs';

const models = (await loadDomains()).filter((model) => model.domain === 'auth');
const configFor = (minLength) => ({
  ...structuredClone(DefaultAuthContractConfig),
  login: {
    ...DefaultAuthContractConfig.login,
    password: { required: true, minLength, emptyStringPolicy: 'reject' },
  },
});
// In-memory protocol fixture only. Never written to the accepted register or
// used to create package/release artifacts; its outputs stay test-only.
function fixtureRegister(configured) {
  const draft = candidates(configured);
  return {
    ...draft,
    status: 'reviewed-register',
    entries: draft.entries.map((entry) => ({ ...entry, status: 'reviewed' })),
  };
}
function fixture(config) {
  const configured = configureAuthModels(models, config);
  const profile = syntheticProfile(configured);
  profile.authConfig = config;
  sealSynthetic(profile);
  return { profile, proposal: fixtureRegister(configured), verification: true };
}

test('default projected schema constraints match the existing canonical artifact', async () => {
  const result = await generate(models, {
    profile: syntheticProfile(models),
    proposal: fixtureRegister(models),
    verification: true,
  });
  const baseline = readJson('packages/auth/openapi/auth-canonical.json')
    .components.schemas;
  // Per-field schemas replace shared password nodes, so the graph walker now
  // reports each occurrence of the same audited coercer. Retain every old
  // location and forbid new limitation kinds/functions before comparing wire
  // constraints independently from review provenance and occurrence metadata.
  for (const [id, schema] of Object.entries(baseline)) {
    const previous = schema['x-contract-projection']?.limitations ?? [];
    const current =
      result.document.components.schemas[id]['x-contract-projection']
        ?.limitations ?? [];
    for (const item of previous)
      assert.ok(
        current.some(
          (candidate) => JSON.stringify(candidate) === JSON.stringify(item),
        ),
        `${id}: missing limitation ${item.path}`,
      );
    for (const item of current)
      assert.ok(
        previous.some(
          (candidate) =>
            candidate.kind === item.kind &&
            candidate.implementation === item.implementation,
        ),
        `${id}: new limitation kind/function`,
      );
  }
  const constraints = (schemas) => {
    const copy = structuredClone(schemas);
    for (const schema of Object.values(copy)) {
      if (schema['x-contract-projection']) {
        delete schema['x-contract-projection'].reviews;
        delete schema['x-contract-projection'].limitations;
      }
    }
    return copy;
  };
  assert.deepEqual(
    constraints(result.document.components.schemas),
    constraints(baseline),
  );
});

test('configured projections are deterministic, explicit and preserve independent JWT defaults', async () => {
  for (const min of [3, 10]) {
    const config = configFor(min);
    const options = fixture(config);
    const result = await generate(models, options);
    const again = await generate(models, options);
    assert.equal(result.jsonText, again.jsonText);
    assert.equal(result.yamlText, again.yamlText);
    assert.deepEqual(result.manifest, again.manifest);
    assert.deepEqual(YAML.parse(result.yamlText), JSON.parse(result.jsonText));
    assert.deepEqual(result.document['x-contract-auth-config'], config);
    assert.deepEqual(result.manifest.profile.authConfig, config);
    assert.equal(result.manifest.status, 'test-only');
    assert.deepEqual(result.manifest.supportedCapabilities, []);
    const ajv = new Ajv2020({ strict: false });
    ajv.addSchema({ ...result.document, $id: 'urn:test:configured-auth' });
    const validator = (id) =>
      ajv.compile({
        $ref:
          'urn:test:configured-auth' +
          result.inventory.operations.find(
            (op) => op.definition.operationId === id,
          ).definition.requestBody.content['application/json'].schema.$ref,
      });
    const session = validator('login');
    const jwt = validator('loginWithJwt');
    for (const password of [
      '1234',
      '12345678',
      '1234567890',
      '😀😀😀😀',
      '\n'.repeat(10),
    ]) {
      const body = { credential: 'reader', password };
      assert.equal(session(body), [...password].length >= min);
      assert.equal(jwt(body), [...password].length >= 6);
    }
  }
});

test('configuration and approvals cannot be silently reused for another host profile', async () => {
  const config = configFor(10);
  const configured = configureAuthModels(models, config);
  const draft = candidates(configured);
  assert.equal(draft.status, 'draft');
  assert.ok(draft.entries.every((entry) => entry.status === 'draft'));
  await assert.rejects(
    generate(models, {
      profile: { ...reviewProfile(models), authConfig: config },
      proposal: draft,
      review: true,
    }),
    /reviewed projection register/,
  );
  await assert.rejects(
    generate(models, {
      profile: { ...reviewProfile(models), authConfig: config },
      proposal: readJson('tools/openapi/projection-proposal.json'),
      review: true,
    }),
    /unreviewed source bytes/,
  );
  await assert.rejects(
    generate(configured, {
      profile: reviewProfile(models),
      proposal: fixtureRegister(configured),
      review: true,
    }),
    /explicit authConfig/,
  );
  const old = fixture(config);
  const changed = fixture(configFor(3));
  await assert.rejects(
    generate(models, { ...changed, proposal: old.proposal }),
    /unreviewed source bytes/,
  );
  // Even a freshly reviewed projection cannot reuse evidence for old rules.
  old.profile.authConfig = changed.profile.authConfig;
  await assert.rejects(
    generate(models, { ...old, proposal: changed.proposal }),
    /source|profile/i,
  );
  // Test evidence never acquires production authorization by relabeling it.
  changed.profile.status = 'approved';
  await assert.rejects(
    generate(models, { ...changed, verification: false }),
    /Synthetic evidence/,
  );
});
