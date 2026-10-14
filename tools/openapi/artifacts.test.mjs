import assert from 'node:assert/strict';
import { test } from 'node:test';
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { canonicalArtifacts, hostArtifacts } from './artifacts.mjs';
import { loadDomains } from './model.mjs';
import { digest, json, readJson } from './common.mjs';
import { syntheticProfile } from './fixtures/synthetic-profile.mjs';
import { assertCanonicalBytes } from '../release/publication-gate.mjs';
import { diffContracts } from './compatibility.mjs';

const models = await loadDomains();
const proposal = readJson('tools/openapi/projection-proposal.json');

test('all canonical domains validate independently without a host and disclose every security obligation', async () => {
  for (const model of models) {
    const result = await canonicalArtifacts([model], proposal);
    const m = result.manifest;
    assert.equal(m.formatVersion, 2);
    assert.equal(m.status, 'canonical');
    assert.equal(m.contractPublication.status, 'validated');
    assert.equal(m.implementationConformance.status, 'unverified');
    assert.equal(m.deploymentCompliance.status, 'unverified');
    assert.deepEqual(m.supportedCapabilities, []);
    assert.equal(m.provenance, null);
    assert.equal(m.operationCount, model.operations.length);
    assert.ok(m.unresolvedHostBindings.length > 0);
    assert.equal(result.document['x-contract-deployment-ready'], false);
    for (const op of model.operations) {
      assert.deepEqual(
        result.document['x-contract-security-obligations'][op.operationId],
        op.security,
      );
      const path = result.document.paths[op.path]?.[op.method.toLowerCase()];
      if (op.security.kind === 'public') assert.deepEqual(path.security, []);
      else {
        assert.equal(path, undefined);
        assert.ok(
          m.excludedOperations.some(
            (e) =>
              e.operationId === op.operationId &&
              e.reason === 'unresolved-security',
          ),
        );
        assert.ok(
          result.inventory.operations.some(
            (e) => e.definition.operationId === op.operationId,
          ),
        );
      }
    }
    if (model.domain === 'forms')
      for (const id of ['D05', 'D08'])
        assert.ok(
          m.hostConformanceBlockers.some(
            (b) => b.id === id && b.status === 'blocked',
          ),
        );
    for (const [name, bytes] of result.artifacts)
      assert.equal(m.artifacts[name], digest(bytes));
    assertCanonicalBytes(model.domain, result, m, (name) =>
      result.artifacts.get(name),
    );
  }
});

test('versioned canonical preparation is deterministic and keeps other packages independent', async () => {
  for (const model of models) {
    const versioned = {
      ...model,
      package: { ...model.package, version: '0.0.1' },
    };
    const first = await canonicalArtifacts([versioned], proposal);
    const again = await canonicalArtifacts(
      [{ ...versioned, operations: model.operations.toReversed() }],
      proposal,
    );
    assert.equal(json(first.manifest), json(again.manifest));
    assert.deepEqual(first.artifacts, again.artifacts);
    assert.equal(first.document.info.version, '0.0.1');
    assert.deepEqual(first.manifest.packages, {
      [model.package.name]: '0.0.1',
    });
    // Preparing proposed bytes never changes the workspace or its manifests.
    assert.equal(
      readJson(`packages/${model.domain}/package.json`).version,
      model.package.version,
    );
  }
  const identity = models.find((m) => m.domain === 'identity');
  const forms = models.find((m) => m.domain === 'forms');
  await assert.rejects(
    canonicalArtifacts(
      [{ ...forms, operations: [...forms.operations, forms.operations[0]] }],
      proposal,
    ),
    /duplicate/,
  );
  await assert.doesNotReject(canonicalArtifacts([identity], proposal));
});

test('canonical publication rejects invalid definitions and stale or missing projection approvals', async () => {
  const auth = models.find((m) => m.domain === 'auth');
  const invalid = {
    ...auth,
    operations: auth.operations.map((op, i) =>
      i ? op : { ...op, security: { kind: 'unknown' } },
    ),
  };
  await assert.rejects(canonicalArtifacts([invalid], proposal), /security/i);
  const invalidSchema = {
    ...auth,
    operations: auth.operations.map((op, i) =>
      i
        ? op
        : {
            ...op,
            requestBody: {
              kind: 'json',
              required: true,
              content: { 'application/json': z.date() },
            },
          },
    ),
  };
  await assert.rejects(
    canonicalArtifacts([invalidSchema], proposal),
    /schema reference/,
  );
  for (const mutation of [
    (p) => {
      p.status = 'proposed';
    },
    (p) => {
      p.entries = [];
    },
    (p) => {
      for (const e of p.entries) e.generatorDigest = '0'.repeat(64);
    },
    (p) => {
      for (const e of p.entries) e.sourceDigest = '0'.repeat(64);
    },
  ]) {
    const changed = structuredClone(proposal);
    mutation(changed);
    await assert.rejects(
      canonicalArtifacts([auth], changed),
      /review|register/i,
    );
  }
});

test('changing status, security, digests or package versions cannot forge canonical publication eligibility', async () => {
  const result = await canonicalArtifacts([models[0]], proposal);
  for (const mutate of [
    (m) => {
      m.status = 'resolved';
    },
    (m) => {
      m.supportedCapabilities = ['auth.session'];
    },
    (m) => {
      m.deploymentCompliance.status = 'verified';
    },
    (m) => {
      m.unresolvedHostBindings = [];
    },
    (m) => {
      m.packages[models[0].package.name] = '9.0.0';
    },
    (m) => {
      m.artifacts[`${m.profile.id}.json`] = digest('{}');
    },
  ]) {
    const manifest = structuredClone(result.manifest);
    mutate(manifest);
    assert.throws(
      () =>
        assertCanonicalBytes('auth-contracts', result, manifest, (n) =>
          result.artifacts.get(n),
        ),
      /manifest drift/,
    );
  }
  assert.throws(
    () =>
      assertCanonicalBytes(
        'auth-contracts',
        result,
        result.manifest,
        () => '{}',
      ),
    /artifact drift/,
  );
  const before = { inventory: result.inventory, manifest: result.manifest };
  const after = structuredClone(before);
  after.manifest.deploymentCompliance.status = 'verified';
  assert.ok(
    diffContracts(before, after).some(
      (f) => f.surface === 'deploymentCompliance' && f.impact === 'breaking',
    ),
  );
});

test('host artifact states preserve synthetic rejection and Forms capability blockers', async () => {
  const eligible = models.filter((m) => m.domain !== 'forms');
  const profile = syntheticProfile(eligible);
  const result = await hostArtifacts(eligible, {
    profile,
    proposal,
    verification: true,
  });
  assert.equal(result.manifest.artifactKind, 'host-test');
  assert.equal(result.manifest.contractPublication.status, 'not-applicable');
  assert.equal(result.manifest.implementationConformance.status, 'unverified');
  assert.equal(result.manifest.deploymentCompliance.status, 'unverified');
  assert.deepEqual(result.manifest.supportedCapabilities, []);
  profile.status = 'approved';
  await assert.rejects(
    hostArtifacts(eligible, { profile, proposal }),
    /Synthetic evidence/,
  );
  await assert.rejects(
    hostArtifacts(models, {
      profile: syntheticProfile(models),
      proposal,
      verification: true,
    }),
    /Blocked capabilities: D05, D08/,
  );
});

test('Nx release authority and historical projection approvals remain separate from artifact presentation', () => {
  const nx = readJson('nx.json').release;
  assert.equal(nx.version.conventionalCommits, true);
  assert.equal(nx.conventionalCommits.types.init.semverBump, 'none');
  assert.equal(nx.projectsRelationship, 'independent');
  assert.equal(nx.versionPlans, undefined);
  assert.notEqual(nx.version.specifierSource, 'version-plans');
  assert.equal(
    Object.keys(readJson('package.json').devDependencies).some((n) =>
      n.startsWith('@changesets/'),
    ),
    false,
  );
  assert.equal(
    readFileSync('tools/openapi/projection-proposal.json', 'utf8').includes(
      'reviewed-register',
    ),
    true,
  );
});
