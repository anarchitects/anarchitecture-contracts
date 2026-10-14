import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import YAML from 'yaml';
import { digest, json } from '../openapi/common.mjs';

const workflow = YAML.parse(
  readFileSync('.github/workflows/publish.yml', 'utf8'),
);
const step = workflow.jobs.publish.steps.find(
  (entry) => entry.name === 'Verify release compatibility',
);
const script =
  /^yarn node --input-type=module <<'NODE'\n([\s\S]+)\nNODE\s*$/.exec(
    step.run,
  )[1];

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'publish-compatibility-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const write = (path, value) => {
    mkdirSync(dirname(join(directory, path)), { recursive: true });
    writeFileSync(
      join(directory, path),
      typeof value === 'string' ? value : json(value),
    );
  };
  for (const path of [
    'tools/openapi/compatibility.mjs',
    'tools/openapi/common.mjs',
    'tools/release/history.mjs',
    'tools/release/projects.mjs',
  ]) {
    mkdirSync(dirname(join(directory, path)), { recursive: true });
    copyFileSync(path, join(directory, path));
  }
  symlinkSync(resolve('node_modules'), join(directory, 'node_modules'), 'dir');
  write('.gitignore', 'node_modules/\n');
  write('tools/contract-authoring/operation-definition.ts', 'export {};\n');
  const run = (command, args, env = {}) =>
    execFileSync(command, args, {
      cwd: directory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });
  const git = (...args) =>
    run('git', [
      '-c',
      'commit.gpgsign=false',
      '-c',
      'tag.gpgsign=false',
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      ...args,
    ]).trim();
  const commit = () => {
    git('add', '.');
    git('commit', '-m', 'chore: fixture');
    return git('rev-parse', 'HEAD');
  };
  const version = (domain, value) =>
    write(`packages/${domain}/package.json`, {
      name: `@anarchitects/${domain}-contracts`,
      version: value,
      exports: {},
    });
  const initialize = (domain, value) => {
    version(domain, value);
    write(`packages/${domain}/README.md`, `${domain}\n`);
    write(`packages/${domain}/LICENSE`, 'MIT\n');
    write(`packages/${domain}/src/index.ts`, 'export {};\n');
    write(`packages/${domain}/openapi/inventory.json`, {
      operations: [],
      schemas: {},
    });
    write(`packages/${domain}/contract-manifest.json`, {});
  };
  const check = (project, releaseVersion) =>
    JSON.parse(
      run(process.execPath, ['--input-type=module', '-e', script], {
        RELEASE_PROJECT: project,
        RELEASE_VERSION: releaseVersion,
      }),
    );
  git('init', '-b', 'main');
  return { write, run, git, commit, version, initialize, check };
}

test('publication checks only its own baseline and preserves exact breaking-migration gates', (t) => {
  const f = fixture(t);
  f.initialize('auth', '0.1.0');
  f.initialize('forms', '0.0.1');
  f.commit();
  f.git('tag', 'auth-contracts@0.1.0');
  f.version('forms', '0.1.0');
  const formsBase = f.commit();
  f.git('tag', 'forms-contracts@0.1.0');
  f.write('packages/forms/src/index.ts', 'export const changed = true;\n');
  f.write('packages/auth/README.md', 'Auth documentation correction\n');
  f.version('auth', '0.1.1');
  f.version('forms', '0.2.0');
  const migration = {
    package: '@anarchitects/forms-contracts',
    baseRevision: formsBase,
    findingsDigest: digest(
      json([
        {
          impact: 'breaking',
          surface: 'packages/forms/src/index.ts',
          detail:
            'Canonical parser/type/operation source changed; generated shape alone cannot prove behavioral compatibility',
        },
      ]),
    ),
    status: 'approved',
    decision: 'fixture',
    owner: 'fixture',
    consumerMigration: 'fixture migration',
    rollback: 'fixture rollback',
  };
  const migrationPath = 'tools/openapi/migrations/forms.json';
  f.write(migrationPath, migration);
  f.commit();
  f.git('tag', 'auth-contracts@0.1.1');
  f.git('tag', 'forms-contracts@0.2.0');

  const auth = f.check('auth-contracts', '0.1.1');
  assert.equal(auth.length, 1);
  assert.equal(auth[0].package, '@anarchitects/auth-contracts');
  assert.equal(auth[0].requiredBump, 'patch');
  assert.equal(f.check('forms-contracts', '0.2.0')[0].requiredBump, 'minor');
  for (const invalid of [
    { ...migration, baseRevision: f.git('rev-parse', 'auth-contracts@0.1.0') },
    { ...migration, findingsDigest: '0'.repeat(64) },
    { ...migration, status: 'proposed' },
    [migration, migration],
  ]) {
    f.write(migrationPath, invalid);
    assert.throws(
      () => f.check('forms-contracts', '0.2.0'),
      /matching reviewed migration/,
    );
    assert.equal(f.check('auth-contracts', '0.1.1').length, 1);
  }
  f.write(migrationPath, migration);
  f.version('forms', '0.1.1');
  assert.throws(
    () => f.check('forms-contracts', '0.1.1'),
    /requires a minor release/,
  );
  assert.throws(
    () => f.check('auth-contracts', '0.1.2'),
    /Release tag must match/,
  );
  assert.throws(() => f.check('contract-checks', '0.1.1'), /Ineligible/);
});

test('first publication compares the parent and requires exactly 0.0.1', (t) => {
  const f = fixture(t);
  f.initialize('auth', '0.0.0');
  f.commit();
  f.write('packages/auth/README.md', 'First publication\n');
  f.version('auth', '0.0.1');
  f.commit();
  f.git('tag', 'auth-contracts@0.0.1');
  assert.equal(f.check('auth-contracts', '0.0.1')[0].requiredBump, 'patch');
  f.version('auth', '0.1.0');
  assert.throws(
    () => f.check('auth-contracts', '0.1.0'),
    /first distribution must be exactly 0.0.1/,
  );
});
