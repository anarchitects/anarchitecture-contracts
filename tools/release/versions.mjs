import semver from 'semver';
import { releaseVersion } from 'nx/release';
import { readJson, invariant } from '../openapi/common.mjs';
import { releaseProjects } from './projects.mjs';
import { localHistory, assertInitialVersion, git } from './history.mjs';

export function validateSpecifier(specifier, firstRelease = false) {
  invariant(
    !specifier ||
      [
        'major',
        'premajor',
        'minor',
        'preminor',
        'patch',
        'prepatch',
        'prerelease',
      ].includes(specifier) ||
      semver.valid(specifier) === specifier,
    'Specifier must be an Nx SemVer keyword or an exact version',
  );
  invariant(
    !firstRelease || !specifier || specifier === '0.0.1',
    'First release specifier must be exactly 0.0.1',
  );
}

const versionCore = (version) => {
  const parsed = semver.parse(version);
  invariant(parsed, `Invalid version: ${version}`);
  return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
};

// Nx resolves both the conventional result and the requested specifier. This
// guard compares those results; it does not implement another bump calculator.
export function validateRequestedVersions(conventional, requested) {
  const expected = conventional.projectsVersionData;
  const actual = requested.projectsVersionData;
  invariant(
    JSON.stringify(Object.keys(expected).sort()) ===
      JSON.stringify(Object.keys(actual).sort()),
    'Specifier changed the selected release projects',
  );
  for (const [project, data] of Object.entries(actual)) {
    const baseline = expected[project];
    invariant(
      data.currentVersion === baseline.currentVersion,
      `${project}: release baseline changed`,
    );
    invariant(
      data.newVersion && semver.gt(data.newVersion, data.currentVersion),
      `${project}: specifier must advance the current version`,
    );
    const promotion =
      semver.prerelease(data.currentVersion) &&
      data.newVersion === versionCore(data.currentVersion);
    invariant(
      baseline.newVersion || promotion,
      `${project}: no Conventional Commit bump; only promotion of an existing prerelease is allowed`,
    );
    const target = baseline.newVersion ?? data.currentVersion;
    invariant(
      versionCore(data.newVersion) === versionCore(target),
      `${project}: specifier must preserve Nx's Conventional Commit version ${versionCore(target)}`,
    );
  }
}

// Use Nx's public API, not a second Conventional Commit-to-SemVer implementation.
export async function previewVersions({
  projects = Object.keys(releaseProjects),
  history = localHistory(),
  firstRelease = false,
  specifier,
} = {}) {
  validateSpecifier(specifier, firstRelease);
  const released = projects.filter((p) => history[p].length);
  const initial = projects.filter((p) => !history[p].length);
  if (firstRelease)
    invariant(
      !released.length,
      'First release selection contains an already released package',
    );
  invariant(
    !specifier || firstRelease || !initial.length,
    'An explicit specifier requires released projects or --first-release',
  );
  const selected = firstRelease ? initial : released;
  for (const project of initial) {
    invariant(
      readJson(`packages/${project.replace(/-contracts$/, '')}/package.json`)
        .version === '0.0.0',
      `${project}: unreleased manifest must remain 0.0.0`,
    );
  }
  if (!selected.length)
    return { projectsVersionData: {}, workspaceVersion: undefined };
  const args = {
    projects: selected,
    dryRun: true,
    firstRelease,
    ...(firstRelease ? { specifier: '0.0.1' } : {}),
    gitCommit: false,
    gitTag: false,
    stageChanges: false,
  };
  const conventional = await releaseVersion(args);
  let result = conventional;
  if (specifier && !firstRelease) {
    result = await releaseVersion({ ...args, specifier });
    validateRequestedVersions(conventional, result);
  }
  for (const [project, data] of Object.entries(result.projectsVersionData)) {
    if (data.newVersion)
      assertInitialVersion(project, data.newVersion, history);
  }
  return result;
}

export async function compatibilityVersions() {
  const history = localHistory();
  // At a tagged release commit, the signed release version is already materialized.
  const tagsAtHead = new Set(git('tag', '--points-at', 'HEAD').split('\n'));
  const tagged = Object.keys(releaseProjects).filter((project) => {
    const version = readJson(
      `packages/${project.replace(/-contracts$/, '')}/package.json`,
    ).version;
    return tagsAtHead.has(`${project}@${version}`);
  });
  const pending = Object.keys(releaseProjects).filter(
    (p) => !tagged.includes(p),
  );
  const result = await previewVersions({ projects: pending, history });
  const versions = Object.fromEntries(
    Object.entries(result.projectsVersionData).map(([p, data]) => [
      releaseProjects[p],
      data.newVersion ?? data.currentVersion,
    ]),
  );
  for (const project of tagged) {
    const version = readJson(
      `packages/${project.replace(/-contracts$/, '')}/package.json`,
    ).version;
    versions[releaseProjects[project]] = version;
    history[project] = history[project].filter((v) => v !== version);
  }
  return { versions, history };
}
