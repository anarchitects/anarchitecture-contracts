import { execFileSync } from 'node:child_process';
import semver from 'semver';
import { invariant } from '../openapi/common.mjs';
import { releaseProjects } from './projects.mjs';

export const git = (...args) =>
  execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }).trim();

export function localHistory(ref = 'HEAD') {
  const tags = git('tag', '--merged', ref).split('\n');
  return Object.fromEntries(
    Object.keys(releaseProjects).map((project) => {
      const versions = tags
        .filter((tag) => tag.startsWith(`${project}@`))
        .map((tag) => tag.slice(project.length + 1));
      invariant(
        versions.every((v) => semver.valid(v) === v && v !== '0.0.0'),
        `${project}: invalid distribution tag`,
      );
      return [project, versions.sort(semver.rcompare)];
    }),
  );
}

async function requestJson(
  url,
  { fetcher = fetch, missing = false, headers = {} } = {},
) {
  const response = await fetcher(url, {
    headers,
    signal: AbortSignal.timeout(30000),
  });
  if (missing && response.status === 404) return null;
  invariant(
    response.ok,
    `Distribution history unavailable: ${url} (${response.status})`,
  );
  return response.json();
}

// Fail closed on authorization/network errors. Only npm's explicit 404 means absent.
export async function distributionHistory({ fetcher = fetch } = {}) {
  const history = localHistory();
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN)
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  for (let page = 1; ; page++) {
    const releases = await requestJson(
      `https://api.github.com/repos/anarchitects/anarchitecture-contracts/releases?per_page=100&page=${page}`,
      { fetcher, headers },
    );
    invariant(Array.isArray(releases), 'Invalid GitHub release history');
    for (const release of releases.filter((r) => !r.draft && r.published_at)) {
      const project = Object.keys(releaseProjects).find((p) =>
        release.tag_name.startsWith(`${p}@`),
      );
      if (project) {
        const version = release.tag_name.slice(project.length + 1);
        invariant(
          semver.valid(version) === version,
          `Invalid release: ${release.tag_name}`,
        );
        invariant(
          history[project].includes(version),
          `Fetch missing release tag ${release.tag_name}; do not restart its lifecycle`,
        );
      }
    }
    if (releases.length < 100) break;
  }
  await Promise.all(
    Object.entries(releaseProjects).map(async ([project, name]) => {
      const data = await requestJson(
        `https://registry.npmjs.org/${encodeURIComponent(name)}`,
        { fetcher, missing: true },
      );
      if (!data) return;
      invariant(
        data.name === name &&
          data.versions &&
          typeof data.versions === 'object',
        `Invalid npm history for ${name}`,
      );
      for (const version of Object.keys(data.versions)) {
        invariant(
          semver.valid(version) === version,
          `Invalid npm version for ${name}`,
        );
        invariant(
          history[project].includes(version),
          `Missing local tag for distributed ${name}@${version}; reconcile history before releasing`,
        );
      }
    }),
  );
  return history;
}

export function assertInitialVersion(
  project,
  version,
  history,
  { publishing = false } = {},
) {
  invariant(
    semver.valid(version) === version,
    `${project}: invalid release version`,
  );
  const prior = history[project].filter((v) => !publishing || v !== version);
  invariant(
    prior.length || version === '0.0.1',
    `${project}: first distribution must be exactly 0.0.1`,
  );
}
