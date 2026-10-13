import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadDomains } from './model.mjs';
import { generate, reviewProfile } from './generate.mjs';
import { readJson, json } from './common.mjs';
import {
  syntheticProfile,
  sealSynthetic,
} from './fixtures/synthetic-profile.mjs';

const all = await loadDomains(),
  models = all.filter((model) => model.domain !== 'forms');
const proposal = readJson('tools/openapi/projection-proposal.json');
const generateFixture = (profile) =>
  generate(models, { profile, proposal, verification: true });

test('complete synthetic resolution preserves AND/OR, cookies, HMAC, statuses, semantics and capability blockers', async () => {
  const result = await generateFixture(syntheticProfile(models));
  assert.equal(result.manifest.status, 'test-only');
  assert.equal(result.manifest.documentedOperationCount, 25);
  assert.deepEqual(result.manifest.supportedCapabilities, []);
  assert.ok(result.manifest.capabilityBlockers.length >= 7);
  for (const operation of result.inventory.operations) {
    const actual =
      result.document.paths[operation.path][operation.method.toLowerCase()];
    if (operation.security.kind !== 'public') assert.ok(actual.security.length);
    if (operation.security.binding === 'identity.protected')
      assert.deepEqual(actual.security, [
        { session: [], device: [] },
        { bearer: [] },
      ]);
    const canonical = models
      .flatMap((m) => m.operations)
      .find((op) => op.operationId === actual.operationId);
    assert.deepEqual(actual['x-contract-semantics'], canonical.semantics);
    assert.deepEqual(
      Object.keys(actual.responses).sort(),
      Object.keys(canonical.responses).sort(),
    );
  }
  const webhook = result.document.paths['/newsletter/webhook'].post;
  assert.deepEqual(webhook.security, [{ signature: [] }]);
  assert.equal(
    webhook.requestBody['x-contract-raw-body'].preserveExactBytes,
    true,
  );
  const login = result.document.paths['/auth/login'].post;
  assert.equal(
    login.responses['200'].headers['set-cookie']['x-contract-cardinality'],
    'repeated',
  );
});

test('release gate rejects incomplete, stale, unrelated, nonpassing and weakened evidence even when resealed', async () => {
  const cases = [
    [
      'missing transport',
      (p) => {
        delete p.securityBindings['identity.protected'];
      },
    ],
    [
      'anonymous OR',
      (p) => {
        p.securityBindings['identity.protected'].push({});
      },
    ],
    [
      'missing HMAC in OR',
      (p) => {
        p.securityBindings['newsletter.webhook-signature'].push({ bearer: [] });
      },
    ],
    [
      'wrong signature header',
      (p) => {
        p.securitySchemes.signature.name = 'Authorization';
      },
    ],
    [
      'missing host binding',
      (p) => {
        delete p.hostBindings[Object.keys(p.hostBindings)[0]];
      },
    ],
    [
      'unresolved binding case',
      (p) => {
        Object.values(p.hostBindings)[0].evidence = ['missing'];
      },
    ],
    [
      'cross-capability evidence',
      (p) => {
        Object.values(p.hostBindings)[0].evidence = [
          p.evidence.tests.find(
            (t) => t.operationId === 'receiveNewsletterWebhook',
          ).id,
        ];
      },
    ],
    [
      'unknown variant',
      (p) => {
        p.variants.push('missing');
      },
    ],
    [
      'missing variant',
      (p) => {
        p.variants = p.variants.filter((v) => !v.startsWith('identity.'));
      },
    ],
    [
      'stale version',
      (p) => {
        p.contractVersions = {
          ...p.contractVersions,
          '@anarchitects/auth-contracts': '99.0.0',
        };
      },
    ],
    [
      'stale source',
      (p) => {
        p.evidence.contractSource = '0'.repeat(64);
      },
    ],
    [
      'stale host revision',
      (p) => {
        p.evidence.hostRevision = '1'.repeat(40);
      },
    ],
    [
      'stale configuration',
      (p) => {
        p.evidence.configurationDigest = '0'.repeat(64);
      },
    ],
    [
      'failure',
      (p) => {
        p.evidence.tests[0].result = 'failed';
      },
    ],
    [
      'skipped',
      (p) => {
        p.evidence.tests[0].result = 'skipped';
      },
    ],
    [
      'ownership missing',
      (p) => {
        p.evidence.tests = p.evidence.tests.filter(
          (t) => t.obligation !== 'resource-ownership',
        );
      },
    ],
    [
      '401 changed to success',
      (p) => {
        p.evidence.tests.find(
          (t) => t.obligation === 'unauthenticated',
        ).httpStatus = 200;
      },
    ],
    [
      '429 changed to success',
      (p) => {
        p.evidence.tests.find(
          (t) => t.obligation === 'outcome:429',
        ).httpStatus = 200;
      },
    ],
    [
      'raw-byte proof missing',
      (p) => {
        p.evidence.tests = p.evidence.tests.filter(
          (t) => t.obligation !== 'signature-mutated-bytes',
        );
      },
    ],
    [
      'secret field',
      (p) => {
        p.securitySchemes.signature.secret = 'SYNTHETIC-NOT-A-SECRET';
      },
    ],
    [
      'disabled operation',
      (p) => {
        p.evidence.tests[0].operationId = 'missing';
      },
    ],
  ];
  for (const [label, mutate] of cases) {
    const profile = syntheticProfile(models);
    mutate(profile);
    sealSynthetic(profile);
    await assert.rejects(generateFixture(profile), undefined, label);
  }
  for (const mutate of [
    (p) => {
      p.host.configurationDigest = '1'.repeat(64);
    },
    (p) => {
      p.securitySchemes.session.name = 'changed';
    },
    (p) => {
      p.approval.evidenceDigest = '0'.repeat(64);
    },
  ]) {
    const profile = syntheticProfile(models);
    mutate(profile);
    await assert.rejects(generateFixture(profile));
  }
  const profile = syntheticProfile(models);
  profile.status = 'approved'; // Even relabeling approval cannot promote fixtures.
  await assert.rejects(
    generate(models, { profile, proposal }),
    /Synthetic evidence/,
  );
});

test('Forms D05/D08 remain capability blockers even with otherwise complete synthetic bindings', async () => {
  const profile = syntheticProfile(all);
  await assert.rejects(
    generate(all, { profile, proposal, verification: true }),
    /Blocked capabilities: D05, D08/,
  );
  const result = await generate(all, {
    profile: reviewProfile(all),
    proposal,
    review: true,
  });
  for (const id of ['D05', 'D08']) {
    const blocker = result.manifest.capabilityBlockers.find(
      (item) => item.id === id,
    );
    assert.equal(blocker.status, 'blocked');
    assert.ok(blocker.implementation.endsWith('/489'));
  }
  assert.ok(
    result.manifest.capabilityBlockers
      .find((b) => b.capability === 'identity.profiles')
      .issues[0].endsWith('/488'),
  );
});

test('CLI emits synthetic artifacts only through verification; rejected release leaves no output', () => {
  const dir = mkdtempSync(join(tmpdir(), 'contracts-profile-'));
  try {
    const file = join(dir, 'profile.json');
    const profile = syntheticProfile(models);
    // CLI uses all packages; select no Forms capabilities, retain all version pins.
    const full = syntheticProfile(all);
    full.capabilities = profile.capabilities;
    full.variants = profile.variants;
    full.hostBindings = profile.hostBindings;
    full.securityBindings = profile.securityBindings;
    full.evidence.tests = profile.evidence.tests;
    sealSynthetic(full);
    writeFileSync(file, json(full));
    const verify = spawnSync(
      process.execPath,
      ['tools/openapi/cli.mjs', 'verify-profile', file, join(dir, 'verified')],
      { encoding: 'utf8' },
    );
    assert.equal(verify.status, 0, verify.stderr);
    const manifest = readJson(join(dir, 'verified/manifest.json'));
    assert.equal(manifest.status, 'test-only');
    // Disabled Forms blockers must still be disclosed by the aggregate manifest.
    assert.ok(manifest.capabilityBlockers.some((b) => b.id === 'D08'));
    full.status = 'approved';
    writeFileSync(file, json(full));
    const release = spawnSync(
      process.execPath,
      ['tools/openapi/cli.mjs', 'release', file, join(dir, 'release')],
      { encoding: 'utf8' },
    );
    assert.notEqual(release.status, 0);
    assert.match(release.stderr, /Synthetic evidence/);
    assert.equal(existsSync(join(dir, 'release')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
