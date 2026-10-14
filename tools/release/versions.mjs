import { releaseVersion } from 'nx/release';
import { readJson, invariant } from '../openapi/common.mjs';
import { releaseProjects } from './projects.mjs';
import { localHistory, assertInitialVersion, git } from './history.mjs';

// Use Nx's public API, not a second Conventional Commit-to-SemVer implementation.
export async function previewVersions({
  projects = Object.keys(releaseProjects),
  history = localHistory(),
  firstRelease = false,
  preid,
} = {}) {
  invariant(
    !firstRelease || !preid,
    'Initial prerelease distribution is forbidden',
  );
  const released = projects.filter((p) => history[p].length);
  const initial = projects.filter((p) => !history[p].length);
  if (firstRelease)
    invariant(
      !released.length,
      'First release selection contains an already released package',
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
  const result = await releaseVersion({
    projects: selected,
    dryRun: true,
    firstRelease,
    preid,
    ...(firstRelease ? { specifier: '0.0.1' } : {}),
    gitCommit: false,
    gitTag: false,
    stageChanges: false,
  });
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
