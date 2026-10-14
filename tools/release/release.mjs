import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { releaseVersion, releaseChangelog } from 'nx/release';
import { invariant } from '../openapi/common.mjs';
import { releaseProjects } from './projects.mjs';
import {
  localHistory,
  distributionHistory,
  assertInitialVersion,
} from './history.mjs';
import { previewVersions, validateSpecifier } from './versions.mjs';
import { checkCompatibility } from './compatibility.mjs';
import { loadDomains } from '../openapi/model.mjs';
import { assertPublishable } from './publication-gate.mjs';

export function releaseOptions(values) {
  const projects = values.projects
    ? values.projects.split(',').map((value) => value.trim())
    : Object.keys(releaseProjects);
  invariant(
    projects.length && projects.every((p) => Object.hasOwn(releaseProjects, p)),
    'Use comma-separated eligible Nx project names, or leave projects empty',
  );
  invariant(
    new Set(projects).size === projects.length,
    'Duplicate release project',
  );
  validateSpecifier(values.specifier, values['first-release']);
  return {
    specifier: values.specifier || undefined,
    projects,
    firstRelease: values['first-release'] ?? false,
    dryRun: values['dry-run'] ?? false,
  };
}

const run = (command, args) =>
  execFileSync(command, args, { stdio: 'inherit' });
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

// Required sequencing only: Nx owns all version, changelog and tag logic.
// The CLI cannot pass independent versionData across an artifact regeneration.
export async function runRelease(options) {
  const history =
    options.dryRun && process.env.RELEASE_CHECK_HISTORY !== 'true'
      ? localHistory()
      : await distributionHistory();
  const preview = await previewVersions({ ...options, history });
  const versions = Object.fromEntries(
    Object.entries(preview.projectsVersionData).map(([p, v]) => [
      releaseProjects[p],
      v.newVersion ?? v.currentVersion,
    ]),
  );
  if (!Object.values(preview.projectsVersionData).some((v) => v.newVersion)) {
    console.log(
      'No released package changes. First distribution requires explicit --first-release and is fixed at 0.0.1.',
    );
    return preview;
  }
  await checkCompatibility(
    (await loadDomains()).filter((model) =>
      Object.hasOwn(preview.projectsVersionData, `${model.domain}-contracts`),
    ),
    'HEAD',
    { versions, history },
    { cumulative: true },
  );
  if (!options.dryRun) {
    invariant(
      process.env.GITHUB_ACTIONS === 'true' &&
        process.env.GITHUB_REF === 'refs/heads/main',
      'Live releases must run through release.yml on main',
    );
    invariant(
      git('status', '--porcelain') === '',
      'Release requires a clean checkout',
    );
    invariant(
      git('rev-parse', 'HEAD') === git('rev-parse', 'origin/main'),
      'main moved; rerun from the reviewed current revision',
    );
    invariant(
      git('config', 'commit.gpgsign') === 'true' &&
        git('config', 'tag.gpgsign') === 'true',
      'Configure the approved release signing key; unsigned releases are disabled',
    );
    Object.entries(preview.projectsVersionData)
      .filter(([, data]) => data.newVersion)
      .forEach(([project]) => assertPublishable(project));
  }
  const result = await releaseVersion({
    ...options,
    projects: Object.keys(preview.projectsVersionData),
    ...(options.firstRelease ? { specifier: '0.0.1' } : {}),
    gitCommit: false,
    gitTag: false,
    stageChanges: !options.dryRun,
  });
  for (const [project, data] of Object.entries(result.projectsVersionData)) {
    invariant(
      data.newVersion === preview.projectsVersionData[project]?.newVersion,
      `${project}: version changed after preview`,
    );
    if (data.newVersion)
      assertInitialVersion(project, data.newVersion, history);
  }
  if (!Object.values(result.projectsVersionData).some((v) => v.newVersion))
    return result;
  if (!options.dryRun) {
    run('yarn', ['nx', 'run', 'contract-checks:generate']);
    run('yarn', ['nx', 'run', 'contract-checks:verify']);
    await checkCompatibility(
      (await loadDomains()).filter((model) =>
        Object.hasOwn(preview.projectsVersionData, `${model.domain}-contracts`),
      ),
      'HEAD',
      { versions, history },
      { cumulative: true },
    );
    Object.entries(result.projectsVersionData)
      .filter(([, v]) => v.newVersion)
      .forEach(([project]) => assertPublishable(project));
    run('git', ['add', '--', 'packages', 'generated', 'yarn.lock']);
  }
  await releaseChangelog({
    ...options,
    projects: Object.keys(result.projectsVersionData),
    versionData: result.projectsVersionData,
    releaseGraph: result.releaseGraph,
    gitCommit: true,
    gitCommitArgs: ['-S'],
    gitTag: true,
    gitTagArgs: ['-s'],
    stageChanges: true,
    gitPush: !options.dryRun,
    createRelease: options.dryRun ? false : 'github',
  });
  return result;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { values } = parseArgs({
    options: {
      projects: { type: 'string', default: process.env.RELEASE_PROJECTS || '' },
      specifier: {
        type: 'string',
        default: process.env.RELEASE_SPECIFIER || '',
      },
      'first-release': {
        type: 'boolean',
        default: process.env.RELEASE_FIRST === 'true',
      },
      'dry-run': {
        type: 'boolean',
        default: process.env.RELEASE_DRY_RUN === 'true',
      },
    },
  });
  await runRelease(releaseOptions(values));
}
