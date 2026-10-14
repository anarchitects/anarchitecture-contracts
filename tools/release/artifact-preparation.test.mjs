import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

test('real Nx initial versioning regenerates canonical bytes and preserves them through rebuild and verification', () => {
  const directory = mkdtempSync(join(tmpdir(), 'canonical-version-'));
  const run = (command, args) =>
    execFileSync(command, args, {
      cwd: directory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NX_DAEMON: 'false',
        NX_ISOLATE_PLUGINS: 'false',
        NX_TUI: 'false',
      },
      maxBuffer: 16 * 1024 * 1024,
    });
  const node = (script) =>
    run(process.execPath, ['--input-type=module', '-e', script]);
  const read = (name) => readFileSync(join(directory, name), 'utf8');
  try {
    for (const path of [
      'tools',
      'packages',
      'baselines',
      'generated',
      'nx.json',
      'package.json',
      'yarn.lock',
      '.yarnrc.yml',
      'tsconfig.json',
    ])
      cpSync(path, join(directory, path), { recursive: true });
    symlinkSync(
      resolve('node_modules'),
      join(directory, 'node_modules'),
      'dir',
    );
    writeFileSync(
      join(directory, '.gitignore'),
      'node_modules/\n.nx/\npackages/*/dist/\n',
    );
    run('git', ['init', '-b', 'main']);
    run('git', ['add', '.']);
    run('git', [
      '-c',
      'commit.gpgsign=false',
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      'commit',
      '-m',
      'init(auth-contracts): fixture',
    ]);
    node(`import { releaseVersion } from 'nx/release';
      const r = await releaseVersion({projects:['auth-contracts'], firstRelease:true, specifier:'0.0.1', dryRun:false, gitCommit:false, gitTag:false, stageChanges:false});
      if (r.projectsVersionData['auth-contracts'].newVersion !== '0.0.1') throw new Error('Wrong first version');`);
    assert.equal(
      JSON.parse(read('packages/auth/package.json')).version,
      '0.0.1',
    );
    for (const domain of ['forms', 'identity', 'newsletter'])
      assert.equal(
        JSON.parse(read(`packages/${domain}/package.json`)).version,
        '0.0.0',
      );
    run(process.execPath, ['tools/openapi/cli.mjs', 'write']);
    const paths = [
      'packages/auth/contract-manifest.json',
      'packages/auth/openapi/auth-canonical.json',
      'packages/auth/openapi/inventory.json',
    ];
    const before = paths.map(read);
    assert.equal(
      JSON.parse(before[0]).packages['@anarchitects/auth-contracts'],
      '0.0.1',
    );
    assert.equal(JSON.parse(before[1]).info.version, '0.0.1');
    run(process.execPath, ['tools/contract-authoring/build.mjs', 'auth']);
    run(process.execPath, ['tools/openapi/cli.mjs', 'check']);
    node(
      `import { assertPublishable } from './tools/release/publication-gate.mjs'; await assertPublishable('auth-contracts');`,
    );
    // The publish job supplies the version extracted from the verified signed tag.
    node(
      `import { assertPublishable } from './tools/release/publication-gate.mjs'; process.env.RELEASE_VERSION='0.0.1'; await assertPublishable('auth-contracts');`,
    );
    assert.throws(
      () =>
        node(
          `import { assertPublishable } from './tools/release/publication-gate.mjs'; process.env.RELEASE_VERSION='0.1.0'; await assertPublishable('auth-contracts');`,
        ),
      /Release tag must match/,
    );
    assert.deepEqual(paths.map(read), before);
    const formsPath = 'packages/forms/contract-manifest.json';
    const formsBefore = read(formsPath);
    const formsManifest = JSON.parse(formsBefore);
    formsManifest.status = 'test-only';
    writeFileSync(join(directory, formsPath), JSON.stringify(formsManifest));
    node(
      `import { assertPublishable } from './tools/release/publication-gate.mjs'; await assertPublishable('auth-contracts');`,
    );
    assert.throws(
      () =>
        node(
          `import { assertPublishable } from './tools/release/publication-gate.mjs'; await assertPublishable('forms-contracts');`,
        ),
      /publication requires canonical/,
    );
    writeFileSync(join(directory, formsPath), formsBefore);
    assert.equal(run('git', ['tag']).trim(), ''); // No release/tag/publication in this fixture.
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
