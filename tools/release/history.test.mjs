import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { digest } from '../openapi/common.mjs';
import { releaseProjects } from './projects.mjs';
import { assertPublishable } from './publication-gate.mjs';
import { gitFile, releaseReports } from '../openapi/compatibility.mjs';
import { loadDomains } from '../openapi/model.mjs';
import {
  assertInitialVersion,
  distributionHistory,
  localHistory,
} from './history.mjs';

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

test('verified npm staging placeholders do not become releases or waive real distribution tags', async () => {
  const placeholders = JSON.parse(
    readFileSync('tools/release/npm-staging-placeholders.json', 'utf8'),
  );
  const response = (body) => ({
    status: 200,
    ok: true,
    json: async () => body,
  });
  const metadata = (name) => ({
    name,
    version: placeholders[name].version,
    stub: true,
    dist: {
      fileCount: 2,
      integrity: placeholders[name].integrity,
      tarball: placeholders[name].tarball,
    },
  });
  const lookup = (change = (value) => value, extraVersions = {}) =>
    distributionHistory({
      fetcher: async (url) => {
        if (url.includes('api.github.com')) return response([]);
        const name = decodeURIComponent(url.split('/').at(-1));
        return response({
          name,
          versions: { '0.0.0-stage': change(metadata(name)), ...extraVersions },
        });
      },
    });
  assert.deepEqual(
    await lookup(),
    localHistory(),
    'placeholders are not added to release history',
  );
  for (const change of [
    (value) => ({ ...value, stub: false }),
    (value) => ({ ...value, stub: undefined }),
    (value) => ({ ...value, name: '@unrelated/package' }),
    (value) => ({ ...value, version: '0.0.0-other' }),
    (value) => ({ ...value, dist: undefined }),
    (value) => ({ ...value, dist: { ...value.dist, fileCount: 3 } }),
    (value) => ({
      ...value,
      dist: { ...value.dist, integrity: 'sha512-unverified' },
    }),
    (value) => ({
      ...value,
      dist: { ...value.dist, tarball: 'https://example.invalid/package.tgz' },
    }),
  ]) {
    await assert.rejects(lookup(change), /Missing local tag/);
  }
  for (const version of ['0.0.0-other', '99.99.99-stage', '99.99.99']) {
    await assert.rejects(
      lookup(undefined, { [version]: { stub: true } }),
      /Missing local tag/,
    );
  }
  await assert.rejects(
    distributionHistory({
      fetcher: async () =>
        response([
          {
            tag_name: 'auth-contracts@0.0.0-stage',
            published_at: 'now',
            draft: false,
          },
        ]),
    }),
    /Fetch missing release tag/,
    'npm placeholders never exempt GitHub releases',
  );
});
