import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { digest } from '../openapi/common.mjs';
import { releaseProjects } from './projects.mjs';
import { assertPublishable } from './publication-gate.mjs';
import { gitFile, releaseReports } from '../openapi/compatibility.mjs';
import { loadDomains } from '../openapi/model.mjs';
import { assertInitialVersion, distributionHistory } from './history.mjs';

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

test('canonical packages pass the integrity gate without host capabilities', async () => {
  for (const project of Object.keys(releaseProjects)) {
    const manifest = await assertPublishable(project);
    assert.deepEqual(manifest.supportedCapabilities, []);
  }
  await assert.rejects(assertPublishable('contract-checks'), /Ineligible/);
});

test('historical rationale is archived exactly and never becomes executable version input', () => {
  const ledger = JSON.parse(
    readFileSync('tools/release/changesets-migration.json', 'utf8'),
  );
  for (const entry of ledger.entries) {
    assert.equal(digest(entry.body), entry.sha256);
    const archived = readFileSync(
      entry.destination.replace(
        '.nx/version-plans',
        'docs/release-history/version-plans',
      ),
      'utf8',
    );
    assert.equal(
      archived,
      entry.body.replace(
        /'@anarchitects\/(auth|forms|identity|newsletter)-contracts'/g,
        '$1-contracts',
      ),
    );
  }
  assert.equal(
    ledger.expectedFirstVersion,
    '0.1.0',
    'Historical evidence is preserved, not current policy',
  );
});

test('first distribution is exactly 0.0.1; publishing the same version on a second channel works', () => {
  const empty = { 'auth-contracts': [] };
  assert.doesNotThrow(() =>
    assertInitialVersion('auth-contracts', '0.0.1', empty),
  );
  for (const v of ['0.0.0', '0.1.0', '1.0.0', '0.0.1-next.0']) {
    assert.throws(
      () => assertInitialVersion('auth-contracts', v, empty),
      /first distribution/,
    );
    assert.throws(
      () =>
        assertInitialVersion(
          'auth-contracts',
          v,
          { 'auth-contracts': [v] },
          { publishing: true },
        ),
      /first distribution/,
    );
  }
  assert.doesNotThrow(() =>
    assertInitialVersion(
      'auth-contracts',
      '0.0.1',
      { 'auth-contracts': ['0.0.1'] },
      { publishing: true },
    ),
  );
  assert.doesNotThrow(() =>
    assertInitialVersion('auth-contracts', '0.0.2', {
      'auth-contracts': ['0.0.1'],
    }),
  );
});

test('history lookup fails closed on outages and missing tags, with only explicit npm 404 treated as absent', async () => {
  const response = (status, body) => ({
    status,
    ok: status === 200,
    json: async () => body,
  });
  const absent = async (url) =>
    url.includes('api.github.com') ? response(200, []) : response(404, {});
  await distributionHistory({ fetcher: absent });
  await assert.rejects(
    distributionHistory({ fetcher: async () => response(503, {}) }),
    /unavailable/,
  );
  await assert.rejects(
    distributionHistory({
      fetcher: async () => {
        throw new Error('offline');
      },
    }),
    /offline/,
  );
  await assert.rejects(
    distributionHistory({
      fetcher: async (url) =>
        url.includes('api.github.com')
          ? response(200, [])
          : response(200, {
              name: decodeURIComponent(url.split('/').at(-1)),
              versions: { '99.99.99': {} },
            }),
    }),
    /Missing local tag/,
  );
  await assert.rejects(
    distributionHistory({
      fetcher: async () =>
        response(200, [
          {
            tag_name: 'auth-contracts@99.99.99',
            published_at: 'now',
            draft: false,
          },
        ]),
    }),
    /Fetch missing/,
  );
});
