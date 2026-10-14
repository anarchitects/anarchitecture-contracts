import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { releaseProjects } from './projects.mjs';
import { runRelease } from './release.mjs';
import { localHistory } from './history.mjs';

const paths = [
  'yarn.lock',
  ...Object.keys(releaseProjects).map(
    (p) => `packages/${p.replace(/-contracts$/, '')}/package.json`,
  ),
];
const before = paths.map((p) => readFileSync(p, 'utf8'));
const initial = Object.keys(releaseProjects).filter(
  (p) => !localHistory()[p].length,
);
const normal = await runRelease({
  projects: Object.keys(releaseProjects),
  dryRun: true,
  firstRelease: false,
});
for (const project of initial)
  assert.equal(normal.projectsVersionData[project]?.newVersion ?? null, null);
if (initial.length) {
  const first = await runRelease({
    projects: initial,
    dryRun: true,
    firstRelease: true,
  });
  assert.equal(first.workspaceVersion, undefined);
  for (const project of initial)
    assert.equal(first.projectsVersionData[project].newVersion, '0.0.1');
}
assert.deepEqual(
  paths.map((p) => readFileSync(p, 'utf8')),
  before,
);
console.log(
  'Nx dry runs preserve manifests/lockfile, keep initialization non-bumping, and explicitly release at 0.0.1.',
);
