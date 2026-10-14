import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  symlinkSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createProjectGraphAsync } from '@nx/devkit';
import { validateCommit, validateReleaseCommit } from './commits.mjs';
import { releaseProjects } from './projects.mjs';
import { validateReleaseVersion } from '../openapi/compatibility.mjs';
import { validateRequestedVersions } from './versions.mjs';
import { digest, json } from '../openapi/common.mjs';

const config = JSON.parse(readFileSync('nx.json', 'utf8'));
const graph = await createProjectGraphAsync();
const initialHistory = Object.fromEntries(
  Object.keys(releaseProjects).map((p) => [p, []]),
);

test('commit validation uses the live Nx graph, explicit types and per-package lifecycle', () => {
  const check = (
    message,
    files = ['packages/auth/src/index.ts'],
    history = initialHistory,
  ) => validateCommit({ message, files }, graph, history);
  check('init(auth-contracts): establish transport');
  check('chore: update release tooling', ['tools/release/release.mjs']);
  check('fix(auth-contracts): correct parsing', undefined, {
    ...initialHistory,
    'auth-contracts': ['0.0.1'],
  });
  for (const message of [
    'init(auth): wrong scope',
    'feat(@anarchitects/auth-contracts): wrong scope',
    'unknown(auth-contracts): no mapping',
    'init(auth-contracts)!: breaking',
    'init(auth-contracts): change\n\nBREAKING CHANGE: broken',
    'init: missing scope',
    'fix(auth-contracts): not released',
  ])
    assert.throws(() => check(message));
  assert.throws(
    () =>
      check('init(auth-contracts): already distributed', undefined, {
        ...initialHistory,
        'auth-contracts': ['0.0.1'],
      }),
    /already released/,
  );
  assert.throws(
    () =>
      check(
        'init(auth-contracts): mixed lifecycle',
        ['packages/auth/src/index.ts', 'packages/forms/src/index.ts'],
        { ...initialHistory, 'forms-contracts': ['0.0.1'] },
      ),
    /mixed/,
  );
  assert.throws(
    () =>
      check(
        'fix(forms-contracts): mixed lifecycle',
        ['packages/auth/src/index.ts', 'packages/forms/src/index.ts'],
        { ...initialHistory, 'forms-contracts': ['0.0.1'] },
      ),
    /Unreleased/,
  );
});

test('real Nx dry runs derive scoped bumps, ignore init/non-bumping types and expose insufficient contract bumps', () => {
  const directory = mkdtempSync(join(tmpdir(), 'contracts-conventional-'));
  const run = (cmd, args) =>
    execFileSync(cmd, args, {
      cwd: directory,
      encoding: 'utf8',
      env: {
        ...process.env,
        NX_DAEMON: 'false',
        NX_ISOLATE_PLUGINS: 'false',
        NX_TUI: 'false',
      },
      maxBuffer: 8 * 1024 * 1024,
    });
  const git = (...args) =>
    run('git', [
      '-c',
      'commit.gpgsign=false',
      '-c',
      'tag.gpgsign=false',
      ...args,
    ]);
  const write = (path, body) =>
    writeFileSync(
      join(directory, path),
      typeof body === 'string' ? body : JSON.stringify(body),
    );
  const commit = (message, project = 'auth-contracts') => {
    write(
      `packages/${project.replace(/-contracts$/, '')}/index.js`,
      `// ${message}\n`,
    );
    git('add', '.');
    git('commit', '-m', message);
  };
  const preview = (project, firstRelease = false, preid) => {
    const script = `import { releaseVersion } from 'nx/release'; const r = await releaseVersion({ projects: [${JSON.stringify(project)}], firstRelease: ${firstRelease}, preid: ${JSON.stringify(preid)}, dryRun: true, gitCommit: false, gitTag: false, stageChanges: false }); console.log('RESULT=' + JSON.stringify(r.projectsVersionData));`;
    const output = run(process.execPath, ['--input-type=module', '-e', script]);
    return JSON.parse(output.split('RESULT=')[1])[project];
  };
  const request = (project, specifier, firstRelease = false) => {
    const script = `import { previewVersions } from ${JSON.stringify(new URL('./versions.mjs', import.meta.url).href)}; const r = await previewVersions({ projects: [${JSON.stringify(project)}], firstRelease: ${firstRelease}, specifier: ${JSON.stringify(specifier)} }); console.log('RESULT=' + JSON.stringify(r.projectsVersionData));`;
    const output = run(process.execPath, ['--input-type=module', '-e', script]);
    return JSON.parse(output.split('RESULT=')[1])[project];
  };
  try {
    symlinkSync(
      resolve('node_modules'),
      join(directory, 'node_modules'),
      'dir',
    );
    write('package.json', {
      name: 'release-fixture',
      private: true,
      workspaces: ['packages/*'],
      packageManager: 'yarn@4.18.1',
    });
    write('.gitignore', 'node_modules/\n.nx/\n');
    write('nx.json', {
      release: {
        ...config.release,
        projects: ['auth-contracts', 'forms-contracts'],
      },
    });
    for (const project of ['auth-contracts', 'forms-contracts']) {
      mkdirSync(
        join(directory, 'packages', project.replace(/-contracts$/, '')),
        { recursive: true },
      );
      write(`packages/${project.replace(/-contracts$/, '')}/package.json`, {
        name: project,
        version: project === 'auth-contracts' ? '1.2.3' : '0.0.0',
      });
      write(`packages/${project.replace(/-contracts$/, '')}/project.json`, {
        name: project,
      });
      write(
        `packages/${project.replace(/-contracts$/, '')}/index.js`,
        '// seed\n',
      );
    }
    git('init', '-b', 'main');
    git('config', 'user.name', 'Release fixture');
    git('config', 'user.email', 'release@example.invalid');
    git('add', '.');
    git('commit', '-m', 'chore: seed fixture');
    git('tag', 'auth-contracts@1.2.3');
    commit('init(forms-contracts): initialize', 'forms-contracts');
    assert.equal(preview('forms-contracts', true).newVersion, null);
    assert.equal(request('forms-contracts', '0.0.1', true).newVersion, '0.0.1');
    assert.throws(() => request('forms-contracts', '0.0.1'), /--first-release/);
    assert.throws(
      () => request('auth-contracts', 'patch'),
      /no Conventional Commit bump/,
    );
    assert.equal(preview('auth-contracts').newVersion, null);
    for (const type of [
      'docs',
      'chore',
      'style',
      'test',
      'e2e',
      'build',
      'ci',
    ]) {
      commit(`${type}(auth-contracts): non-bumping change`);
      assert.equal(preview('auth-contracts').newVersion, null);
    }
    commit('fix(auth-contracts): correction');
    assert.equal(preview('auth-contracts').newVersion, '1.2.4');
    assert.equal(request('auth-contracts', 'patch').newVersion, '1.2.4');
    assert.throws(() => request('auth-contracts', 'minor'), /must preserve/);
    const findings = [{ impact: 'breaking', surface: 'response' }];
    const migration = {
      status: 'approved',
      package: 'auth-contracts',
      baseRevision: 'base',
      findingsDigest: digest(json(findings)),
      owner: 'reviewer',
      decision: 'ADR',
      consumerMigration: 'migrate',
      rollback: 'pin',
    };
    assert.throws(
      () =>
        validateReleaseVersion({
          name: 'auth-contracts',
          version: '1.2.3',
          nextVersion: preview('auth-contracts').newVersion,
          findings,
          migration,
          baseRevision: 'base',
        }),
      /major release/,
    );
    commit('feat(auth-contracts): addition');
    assert.equal(preview('auth-contracts').newVersion, '1.3.0');
    assert.equal(
      request('auth-contracts', '1.3.0-beta.0').newVersion,
      '1.3.0-beta.0',
    );
    assert.equal(request('auth-contracts', 'preminor').newVersion, '1.3.0-0');
    assert.throws(() => request('auth-contracts', 'patch'), /must preserve/);
    assert.equal(
      preview('auth-contracts', false, 'next').newVersion,
      '1.3.0-next.0',
    );
    commit('fix(auth-contracts)!: reviewed break');
    const nextVersion = preview('auth-contracts').newVersion;
    assert.equal(nextVersion, '2.0.0');
    validateReleaseVersion({
      name: 'auth-contracts',
      version: '1.2.3',
      nextVersion,
      findings,
      migration,
      baseRevision: 'base',
    });
    assert.throws(
      () =>
        validateReleaseVersion({
          name: 'auth-contracts',
          version: '1.2.3',
          nextVersion,
          findings,
        }),
      /reviewed migration/,
    );
    write('packages/auth/package.json', {
      name: 'auth-contracts',
      version: '1.3.0-beta.0',
    });
    commit('chore: fixture prerelease');
    git('tag', 'auth-contracts@1.3.0-beta.0');
    assert.equal(request('auth-contracts', '1.3.0').newVersion, '1.3.0');
    assert.equal(request('auth-contracts', 'patch').newVersion, '1.3.0');
    assert.throws(
      () => request('auth-contracts', 'prerelease'),
      /no Conventional Commit bump/,
    );
    assert.throws(() => request('auth-contracts', '1.4.0'), /only promotion/);
    commit('fix(auth-contracts): prerelease correction');
    assert.equal(
      request('auth-contracts', 'prerelease').newVersion,
      '1.3.0-beta.1',
    );
    assert.equal(request('auth-contracts', '1.3.0').newVersion, '1.3.0');
    assert.throws(
      () => request('auth-contracts', '1.3.0-alpha.0'),
      /must advance/,
    );

    // Begin an already-released 0.0.x line: init must not stand in for fixes.
    write('packages/auth/package.json', {
      name: 'auth-contracts',
      version: '0.0.1',
    });
    commit('chore: fixture zero-major line');
    git('tag', 'auth-contracts@0.0.1');
    // Remove the unrelated fixture's larger tag, never any real repository tag.
    git('tag', '-d', 'auth-contracts@1.2.3', 'auth-contracts@1.3.0-beta.0');
    commit('fix(auth-contracts): correction on released zero-major');
    assert.equal(preview('auth-contracts').newVersion, '0.0.2');
    commit('feat(auth-contracts): addition on zero-major');
    const additionVersion = preview('auth-contracts').newVersion;
    assert.equal(additionVersion, '0.0.2');
    validateReleaseVersion({
      name: 'auth-contracts',
      version: '0.0.1',
      nextVersion: additionVersion,
      findings: [{ impact: 'minor' }],
    });
    assert.throws(() => request('auth-contracts', '0.1.0'), /must preserve/);
    assert.throws(
      () =>
        validateReleaseVersion({
          name: 'auth-contracts',
          version: '0.0.1',
          nextVersion: additionVersion,
          findings,
          migration,
          baseRevision: 'base',
        }),
      /minor release/,
    );
    commit(
      'fix(auth-contracts): breaking footer\n\nBREAKING CHANGE: response changed',
    );
    const breakingVersion = preview('auth-contracts').newVersion;
    assert.equal(breakingVersion, '0.1.0');
    validateReleaseVersion({
      name: 'auth-contracts',
      version: '0.0.1',
      nextVersion: breakingVersion,
      findings,
      migration,
      baseRevision: 'base',
    });
    // Start a fresh release baseline so the header assertion cannot pass merely
    // because the earlier footer already declared a break.
    write('packages/auth/package.json', {
      name: 'auth-contracts',
      version: '0.1.0',
    });
    commit('chore: fixture next zero-major line');
    git('tag', 'auth-contracts@0.1.0');
    commit('feat(auth-contracts)!: reviewed zero-major break');
    assert.equal(preview('auth-contracts').newVersion, '0.2.0');
    assert.equal(
      JSON.parse(readFileSync(join(directory, 'packages/auth/package.json')))
        .version,
      '0.1.0',
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('initial development preserves migration review without inventing pre-publication bumps', () => {
  const findings = [{ impact: 'minor' }];
  for (const nextVersion of ['0.0.0', '0.0.1'])
    validateReleaseVersion({
      name: 'auth',
      version: '0.0.0',
      nextVersion,
      findings,
      unreleased: true,
    });
  assert.throws(
    () =>
      validateReleaseVersion({
        name: 'auth',
        version: '0.0.0',
        nextVersion: '0.1.0',
        findings,
        unreleased: true,
      }),
    /initial/,
  );
  assert.throws(
    () =>
      validateReleaseVersion({
        name: 'auth',
        version: '0.0.0',
        nextVersion: '0.0.0',
        findings: [{ impact: 'breaking' }],
        unreleased: true,
      }),
    /reviewed migration/,
  );
});

test('tagged release commits cannot conceal runtime edits or dependency changes', () => {
  const before = { 'auth-contracts': { name: 'auth', version: '0.0.0' } };
  const after = { 'auth-contracts': { name: 'auth', version: '0.0.1' } };
  const data = {
    files: ['packages/auth/package.json', 'packages/auth/CHANGELOG.md'],
    tags: ['auth-contracts@0.0.1'],
    before,
    after,
    history: initialHistory,
  };
  validateReleaseCommit(data);
  assert.throws(
    () =>
      validateReleaseCommit({ ...data, files: ['packages/auth/src/index.ts'] }),
    /implementation changes/,
  );
  assert.throws(
    () => validateReleaseCommit({ ...data, tags: [] }),
    /exact version tag/,
  );
  assert.throws(
    () =>
      validateReleaseCommit({
        ...data,
        after: {
          'auth-contracts': {
            ...after['auth-contracts'],
            dependencies: { unexpected: '*' },
          },
        },
      }),
    /only change manifest/,
  );
});

test('one explicit specifier must respect every selected independent project', () => {
  const data = (versions) => ({
    projectsVersionData: Object.fromEntries(
      Object.entries(versions).map(([p, next]) => [
        p,
        { currentVersion: '1.0.0', newVersion: next },
      ]),
    ),
  });
  const conventional = data({ auth: '1.1.0', forms: '1.0.1' });
  validateRequestedVersions(
    conventional,
    data({ auth: '1.1.0-beta.0', forms: '1.0.1-beta.0' }),
  );
  assert.throws(
    () =>
      validateRequestedVersions(
        conventional,
        data({ auth: '1.1.0', forms: '1.1.0' }),
      ),
    /forms.*must preserve/,
  );
  assert.throws(
    () => validateRequestedVersions(conventional, data({ auth: '1.1.0' })),
    /selected release projects/,
  );
});
