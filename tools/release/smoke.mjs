import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import semver from 'semver';
import { runRelease } from './release.mjs';
import { readReleasePlans, releaseProjects } from './plans.mjs';

// Exercise Nx itself, without tags, commits, registry access or publication.
const manifests = Object.fromEntries(
  Object.keys(releaseProjects).map((project) => {
    const domain = project.replace(/-contracts$/, '');
    const path = `packages/${domain}/package.json`;
    return [project, { path, bytes: readFileSync(path, 'utf8') }];
  }),
);
const plans = readReleasePlans();
const planFiles = () =>
  existsSync('.nx/version-plans') ? readdirSync('.nx/version-plans') : [];
const planBytes = Object.fromEntries(
  planFiles().map((name) => [
    name,
    readFileSync(`.nx/version-plans/${name}`, 'utf8'),
  ]),
);
const lock = readFileSync('yarn.lock', 'utf8');
const firstRelease = Object.values(manifests).every(
  ({ bytes }) => JSON.parse(bytes).version === '0.0.0',
);
const result = await runRelease({
  projects: Object.keys(releaseProjects),
  dryRun: true,
  firstRelease,
});
assert.equal(
  result.workspaceVersion,
  undefined,
  'Domain versions must remain independent',
);
assert.deepEqual(
  Object.keys(result.projectsVersionData).sort(),
  Object.keys(releaseProjects).sort(),
  'Only allowlisted projects may be versioned',
);
for (const [project, { path, bytes }] of Object.entries(manifests)) {
  const pkg = JSON.parse(bytes);
  const bump = plans[pkg.name];
  const expected = bump ? semver.inc(pkg.version, bump) : null;
  assert.equal(
    result.projectsVersionData[project]?.newVersion ?? null,
    expected,
    project,
  );
  if (firstRelease)
    assert.equal(
      expected,
      '0.1.0',
      'Preserve the pending Changesets minor intent',
    );
  assert.equal(readFileSync(path, 'utf8'), bytes, 'Dry run changed a package');
}
assert.equal(
  readFileSync('yarn.lock', 'utf8'),
  lock,
  'Dry run changed the lockfile',
);
assert.deepEqual(
  Object.fromEntries(
    planFiles().map((name) => [
      name,
      readFileSync(`.nx/version-plans/${name}`, 'utf8'),
    ]),
  ),
  planBytes,
);
console.log(
  'Nx independent release dry run preserves versions, lockfile and plans.',
);
