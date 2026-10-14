import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  diffContracts,
  requiredBump,
  validateReleaseVersion,
} from './compatibility.mjs';
import { readJson } from './common.mjs';
import { loadDomains } from './model.mjs';
import { canonicalArtifacts } from './artifacts.mjs';
import { assertCanonicalBytes } from '../release/publication-gate.mjs';

const snapshot = (domain) => ({
  inventory: readJson(`packages/${domain}/openapi/inventory.json`),
  manifest: readJson(`packages/${domain}/contract-manifest.json`),
});
const changeDigest = (snapshot) => {
  snapshot.manifest.projectionProposal.digest = '0'.repeat(64);
};

test('an unrelated shared P07 digest is patch metadata only for packages whose distributed manifest changes', () => {
  for (const domain of ['auth', 'identity', 'newsletter']) {
    const before = snapshot(domain);
    assert.deepEqual(diffContracts(before, structuredClone(before)), []);
    assert.equal(requiredBump('0.1.0', diffContracts(before, before)), null);
    const after = structuredClone(before);
    changeDigest(after);
    const findings = diffContracts(before, after);
    assert.deepEqual(
      findings.map(({ impact, surface }) => ({ impact, surface })),
      [{ impact: 'patch', surface: 'projectionProposal' }],
    );
    assert.equal(requiredBump('0.1.0', findings), 'patch');
    validateReleaseVersion({
      name: domain,
      version: '0.1.0',
      nextVersion: '0.1.1',
      findings,
    });
  }
});

test('shared provenance cannot conceal local P07, schema, approval or security changes', () => {
  const before = snapshot('identity');
  for (const mutate of [
    (value) => {
      value.manifest.projectionReviews = {};
    },
    ...[
      'sourceDigest',
      'generatorDigest',
      'kind',
      'rationale',
      'owner',
      'decision',
    ].map((key) => (value) => {
      Object.values(value.manifest.projectionReviews)[0][key] = 'changed';
    }),
    (value) => {
      value.manifest.projectionProposal.status = 'draft';
    },
    (value) => {
      value.manifest.projectionProposal.id = 'another-register';
    },
    (value) => {
      value.manifest.projectionProposal.digest = 'invalid';
    },
    (value) => {
      delete value.manifest.projectionProposal;
    },
    (value) => {
      value.inventory.operations[0].security = { kind: 'public' };
    },
    (value) => {
      value.manifest.unresolvedHostBindings = [];
    },
    (value) => {
      value.inventory.schemas[
        Object.keys(value.inventory.schemas)[0]
      ].additionalProperties = true;
    },
    (value) => {
      value.manifest.provenance = { approval: 'different host attestation' };
    },
  ]) {
    const after = structuredClone(before);
    changeDigest(after);
    mutate(after);
    const findings = diffContracts(before, after);
    assert.equal(requiredBump('0.1.0', findings), 'minor');
    assert.throws(
      () =>
        validateReleaseVersion({
          name: 'identity',
          version: '0.1.0',
          nextVersion: '0.2.0',
          findings,
        }),
      /reviewed migration/,
    );
  }
});

test('Forms D08 response replacement remains breaking independently of review provenance', () => {
  const after = snapshot('forms');
  const before = structuredClone(after);
  const operation = before.inventory.operations.find(
    ({ definition }) => definition.operationId === 'getFormDefinition',
  );
  operation.definition.responses[200].content['application/json'].schema.$ref =
    '#/components/schemas/forms.FormDefinitionEnvelopeResponse.Output';
  changeDigest(before);
  const findings = diffContracts(before, after);
  assert.ok(
    findings.some(
      ({ surface, impact }) =>
        surface === 'getFormDefinition' && impact === 'breaking',
    ),
  );
  assert.equal(requiredBump('0.1.0', findings), 'minor');
  assert.equal(requiredBump('1.0.0', findings), 'major');
  assert.throws(
    () =>
      validateReleaseVersion({
        name: 'forms',
        version: '0.1.0',
        nextVersion: '0.1.1',
        findings,
      }),
    /minor release/,
  );
  assert.throws(
    () =>
      validateReleaseVersion({
        name: 'forms',
        version: '0.1.0',
        nextVersion: '0.2.0',
        findings,
      }),
    /reviewed migration/,
  );
});

test('patch provenance classification never authorizes stale P07 pins, changed limitations or forged manifest bytes', async () => {
  const models = await loadDomains();
  const identity = models.find(({ domain }) => domain === 'identity');
  const register = readJson('tools/openapi/projection-proposal.json');
  const expected = await canonicalArtifacts([identity], register);
  for (const key of [
    'sourceDigest',
    'generatorDigest',
    'status',
    'limitations',
  ]) {
    const changed = structuredClone(register);
    const entry = changed.entries.find(({ domain }) => domain === 'identity');
    entry[key] =
      key === 'limitations' ? [] : key === 'status' ? 'draft' : '0'.repeat(64);
    await assert.rejects(
      canonicalArtifacts([identity], changed),
      /unreviewed|incomplete review/,
    );
  }
  const forged = structuredClone(expected.manifest);
  forged.projectionProposal.digest = '0'.repeat(64);
  assert.throws(
    () =>
      assertCanonicalBytes(identity.domain, expected, forged, (name) =>
        expected.artifacts.get(name),
      ),
    /manifest drift/,
  );
  const repeated = await canonicalArtifacts([identity], register);
  assert.deepEqual(repeated.artifacts, expected.artifacts);
  assert.deepEqual(repeated.manifest, expected.manifest);
});

test('package-local artifact changes require patch only while their normative inventory and reviews remain unchanged', () => {
  const before = snapshot('newsletter');
  const after = structuredClone(before);
  const artifact = Object.keys(after.manifest.artifacts)[0];
  after.manifest.artifacts[artifact] = '0'.repeat(64);
  const findings = diffContracts(before, after);
  assert.deepEqual(
    findings.map(({ impact, surface }) => ({ impact, surface })),
    [{ impact: 'patch', surface: 'generated-artifacts' }],
  );
  assert.equal(requiredBump('0.1.0', findings), 'patch');
  // Classifying a byte difference never attests that those bytes are valid.
  // The independent canonical byte gate above rejects forged manifests.
  after.inventory.operations[0].definition.responses = {};
  assert.equal(requiredBump('0.1.0', diffContracts(before, after)), 'minor');
});
