import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { digest } from '../openapi/common.mjs';
import {
  migrateChangeset,
  parsePlan,
  readReleasePlans,
  releaseProjects,
} from './plans.mjs';
import { assertPublishable } from './publication-gate.mjs';
import { gitFile, releaseReports } from '../openapi/compatibility.mjs';
import { loadDomains } from '../openapi/model.mjs';

test('large historical inventories are compared rather than silently treated as new', async () => {
  const path = 'packages/newsletter/openapi/inventory.json';
  const historical = gitFile('HEAD', path);
  assert.ok(historical.length > 1024 * 1024);
  assert.doesNotThrow(() => JSON.parse(historical));
  const report = releaseReports(await loadDomains(), 'HEAD').find(
    (entry) => entry.package === '@anarchitects/newsletter-contracts',
  );
  assert.ok(
    !report.findings.some((entry) =>
      entry.detail.startsWith('First generated'),
    ),
  );
  assert.equal(gitFile('HEAD', 'no-such-contract-file'), null);
  assert.throws(() => gitFile('no-such-contract-revision', path));
});

test('all historical Changesets retain their per-package intent and exact rationale', () => {
  const ledger = JSON.parse(
    readFileSync('tools/release/changesets-migration.json', 'utf8'),
  );
  const bumps = {};
  for (const entry of ledger.entries) {
    assert.equal(digest(entry.body), entry.sha256);
    const transferred = migrateChangeset(entry.body);
    if (existsSync(entry.destination)) {
      assert.equal(readFileSync(entry.destination, 'utf8'), transferred);
    }
    const { entries, rationale } = parsePlan(transferred, entry.destination);
    assert.equal(rationale, entry.body.split(/\r?\n---\r?\n/)[1].trim());
    for (const [project, bump] of Object.entries(entries)) {
      assert.equal(bump, 'minor');
      bumps[releaseProjects[project]] = bump;
    }
  }
  assert.equal(ledger.entries.length, 4);
  assert.deepEqual(
    Object.keys(bumps).sort(),
    Object.values(releaseProjects).sort(),
  );
});

test('PR release intent excludes unchanged plans and mechanically migrated historical entries', () => {
  const directory = mkdtempSync(join(tmpdir(), 'contracts-plans-'));
  try {
    const body =
      '---\nauth-contracts: minor\n---\n\nfeat: compatible addition\n';
    const path = join(directory, 'change.md');
    writeFileSync(path, body);
    assert.deepEqual(readReleasePlans({ directory }), {
      '@anarchitects/auth-contracts': 'minor',
    });
    assert.deepEqual(
      readReleasePlans({
        directory,
        previous: (file) => (file === path ? body : null),
      }),
      {},
    );
    const old = body.replace(
      'auth-contracts:',
      "'@anarchitects/auth-contracts':",
    );
    assert.deepEqual(
      readReleasePlans({
        directory,
        previous: (file) => (file === '.changeset/change.md' ? old : null),
      }),
      {},
    );
    writeFileSync(path, body.replace('minor', 'major'));
    assert.deepEqual(readReleasePlans({ directory, previous: () => body }), {
      '@anarchitects/auth-contracts': 'major',
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('release plans reject unknown/root projects, invalid bumps, duplicates and missing rationale', () => {
  for (const body of [
    '---\nanarchitecture-contracts: minor\n---\nRoot must not publish',
    '---\nauth-contracts: patch\nauth-contracts: minor\n---\nAmbiguous',
    '---\nauth-contracts: latest\n---\nInvalid bump',
    '---\nauth-contracts: minor\n---\n',
    '---\n{}\n---\nNo projects',
  ])
    assert.throws(() => parsePlan(body, 'invalid.md'));
});

test('current review-only packages cannot pass the Nx publication gate', () => {
  for (const project of Object.keys(releaseProjects)) {
    assert.throws(() => assertPublishable(project), /publication blocked/);
  }
  assert.throws(() => assertPublishable('contract-checks'), /Ineligible/);
});
