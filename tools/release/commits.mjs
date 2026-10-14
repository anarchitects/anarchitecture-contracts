import { pathToFileURL } from 'node:url';
import { createProjectGraphAsync } from '@nx/devkit';
import { invariant, readJson } from '../openapi/common.mjs';
import { releaseProjects } from './projects.mjs';
import {
  git,
  localHistory,
  distributionHistory,
  assertInitialVersion,
} from './history.mjs';

export function validateCommit(
  { message, files },
  graph,
  history,
  types = readJson('nx.json').release.conventionalCommits.types,
) {
  const header = message.split('\n')[0];
  const match = /^([a-z]+)(?:\(([^()]+)\))?(!)?: (\S.*)$/.exec(header);
  invariant(match, `Invalid Conventional Commit: ${header}`);
  const [, type, scope, breaking] = match;
  invariant(
    Object.hasOwn(types, type) && typeof types[type].semverBump === 'string',
    `Unknown/unmapped commit type: ${type}`,
  );
  invariant(
    !scope || Object.hasOwn(graph.nodes, scope),
    `Scope must be an exact Nx project name: ${scope}`,
  );
  const affected = Object.keys(releaseProjects).filter((project) => {
    const root = graph.nodes[project]?.data.root;
    invariant(root, `Missing release project: ${project}`);
    return files.some((file) => file.startsWith(`${root}/`));
  });
  if (type === 'init') {
    invariant(
      scope && Object.hasOwn(releaseProjects, scope),
      'init requires an exact publishable Nx project scope',
    );
    invariant(
      !history[scope].length,
      `${scope} is already released; init is forbidden`,
    );
    invariant(
      !breaking && !/^BREAKING[ -]CHANGE:/m.test(message),
      'init must remain non-bumping, including breaking notation',
    );
    invariant(
      affected.every((p) => !history[p].length),
      'Split mixed-lifecycle init commits',
    );
  } else {
    invariant(
      affected.every((p) => history[p].length),
      'Unreleased package-specific changes require init(<nx-project-name>); split mixed lifecycle commits',
    );
  }
  return { type, scope, affected };
}

export function validateReleaseCommit({ files, tags, before, after, history }) {
  for (const file of files) {
    invariant(
      file === 'yarn.lock' ||
        /^generated\//.test(file) ||
        /^packages\/(auth|forms|identity|newsletter)\/(package\.json|CHANGELOG\.md|contract-manifest\.json|openapi\/.+)$/.test(
          file,
        ),
      `Release commit cannot include implementation changes: ${file}`,
    );
  }
  let count = 0;
  for (const project of Object.keys(releaseProjects)) {
    if (!before[project] || !after[project]) continue;
    const { version: previous, ...oldPackage } = before[project];
    const { version: version, ...newPackage } = after[project];
    invariant(
      JSON.stringify(oldPackage) === JSON.stringify(newPackage),
      `${project}: release commit may only change manifest version`,
    );
    if (previous === version) continue;
    invariant(
      tags.includes(`${project}@${version}`),
      `${project}: release commit requires its exact version tag`,
    );
    assertInitialVersion(project, version, history);
    count++;
  }
  invariant(count > 0, 'Release commit must version a tagged package');
}

export async function checkCommits(
  base,
  { remote = false, title = process.env.CONTRACTS_PR_TITLE } = {},
) {
  invariant(base, 'Usage: commits <base-ref>');
  const revision = git('rev-parse', '--verify', `${base}^{commit}`);
  const graph = await createProjectGraphAsync();
  if (remote) await distributionHistory();
  const commits = git(
    'rev-list',
    '--reverse',
    '--no-merges',
    `${revision}..HEAD`,
  )
    .split('\n')
    .filter(Boolean);
  for (const sha of commits) {
    const message = git('show', '-s', '--format=%B', sha);
    const files = git('diff-tree', '--no-commit-id', '--name-only', '-r', sha)
      .split('\n')
      .filter(Boolean);
    // Nx's release commit is checked by the release/publication gates. Require
    // matching version tags; a similarly named ordinary commit is not exempt.
    const tags = git('tag', '--points-at', sha).split('\n');
    const isRelease =
      message.split('\n')[0] === 'chore: release packages' &&
      Object.keys(releaseProjects).some((p) =>
        tags.some((t) => t.startsWith(`${p}@`)),
      );
    if (isRelease) {
      const packagesAt = (ref) =>
        Object.fromEntries(
          Object.keys(releaseProjects).map((p) => [
            p,
            JSON.parse(
              git(
                'show',
                `${ref}:packages/${p.replace(/-contracts$/, '')}/package.json`,
              ),
            ),
          ]),
        );
      validateReleaseCommit({
        files,
        tags,
        before: packagesAt(`${sha}^`),
        after: packagesAt(sha),
        history: localHistory(`${sha}^`),
      });
    } else validateCommit({ message, files }, graph, localHistory(`${sha}^`));
  }
  if (title)
    validateCommit(
      {
        message: title,
        files: git('diff', '--name-only', revision, 'HEAD').split('\n'),
      },
      graph,
      localHistory(revision),
    );
  console.log(
    `Validated ${commits.length} commits${title ? ' and squash title' : ''} against the Nx project graph.`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await checkCommits(process.argv[2], {
    remote: process.env.GITHUB_ACTIONS === 'true',
  });
}
