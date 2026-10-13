import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import semver from 'semver';
import { releaseVersion, releaseChangelog } from 'nx/release';
import { invariant, readJson } from '../openapi/common.mjs';
import { readReleasePlans, releaseProjects } from './plans.mjs';
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
  const specifier = values.specifier || undefined;
  invariant(
    !specifier ||
      [
        'patch',
        'minor',
        'major',
        'prepatch',
        'preminor',
        'premajor',
        'prerelease',
      ].includes(specifier) ||
      semver.valid(specifier) === specifier,
    'Invalid release specifier',
  );
  return {
    projects,
    specifier,
    firstRelease: values['first-release'] ?? false,
    dryRun: values['dry-run'] ?? false,
  };
}

const run = (command, args) =>
  execFileSync(command, args, { stdio: 'inherit' });
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

// Required sequencing only: Nx owns all version, plan, changelog and tag logic.
// The CLI cannot pass independent versionData across an artifact regeneration.
export async function runRelease(options) {
  const plans = readReleasePlans();
  invariant(
    !options.specifier ||
      !options.projects.some((p) => plans[releaseProjects[p]]),
    'Pending Nx version plans control the bump; edit the reviewed plan instead of overriding it',
  );
  for (const project of options.projects) {
    const version = readJson(
      `packages/${project.replace(/-contracts$/, '')}/package.json`,
    ).version;
    invariant(
      options.firstRelease === (version === '0.0.0'),
      `${project}: first-release must match the unreleased 0.0.0 state`,
    );
  }
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
    options.projects.forEach(assertPublishable);
  }
  const result = await releaseVersion({
    ...options,
    gitCommit: false,
    gitTag: false,
    stageChanges: !options.dryRun,
    deleteVersionPlans: false,
  });
  if (!Object.values(result.projectsVersionData).some((v) => v.newVersion))
    return result;
  if (!options.dryRun) {
    run('yarn', ['nx', 'run', 'contract-checks:generate']);
    run('yarn', ['nx', 'run', 'contract-checks:verify']);
    run('yarn', ['nx', 'run', 'contract-checks:compatibility', '--', 'HEAD']);
    Object.entries(result.projectsVersionData)
      .filter(([, v]) => v.newVersion)
      .forEach(([project]) => assertPublishable(project));
    run('git', ['add', '--', 'packages', 'generated', 'yarn.lock']);
  }
  await releaseChangelog({
    ...options,
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
