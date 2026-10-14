import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

test('Nx creates project GitHub Releases; dry runs do not write or publish', () => {
  const directory = mkdtempSync(join(tmpdir(), 'contracts-changelog-'));
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
        GITHUB_TOKEN: 'fixture-token-never-sent',
        // Ensure Nx uses the intercepted native fetch, never a proxy client.
        HTTP_PROXY: '',
        HTTPS_PROXY: '',
        ALL_PROXY: '',
        http_proxy: '',
        https_proxy: '',
        all_proxy: '',
      },
      maxBuffer: 8 * 1024 * 1024,
    });
  const write = (path, value) =>
    writeFileSync(
      join(directory, path),
      typeof value === 'string' ? value : JSON.stringify(value),
    );
  try {
    symlinkSync(
      resolve('node_modules'),
      join(directory, 'node_modules'),
      'dir',
    );
    const config = JSON.parse(readFileSync('nx.json', 'utf8'));
    config.release.projects = ['auth-contracts', 'forms-contracts'];
    config.release.changelog.projectChangelogs.renderOptions = {
      authors: false,
    };
    write('nx.json', { release: config.release });
    write('package.json', {
      name: 'changelog-fixture',
      private: true,
      workspaces: ['packages/*'],
    });
    write('.gitignore', 'node_modules/\n.nx/\n');
    for (const domain of ['auth', 'forms']) {
      mkdirSync(join(directory, `packages/${domain}`), { recursive: true });
      write(`packages/${domain}/package.json`, {
        name: `${domain}-contracts`,
        version: '0.0.0',
      });
      write(`packages/${domain}/project.json`, { name: `${domain}-contracts` });
    }
    run('git', ['init', '-b', 'main']);
    run('git', [
      'remote',
      'add',
      'origin',
      'https://github.com/fixture/contracts.git',
    ]);
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
      'chore: seed fixture',
    ]);
    const initialHead = run('git', ['rev-parse', 'HEAD']).trim();
    const output = run(process.execPath, [
      '--input-type=module',
      '-e',
      `
      import assert from 'node:assert/strict';
      import { existsSync, readFileSync } from 'node:fs';
      import { releaseVersion } from 'nx/release';
      import { releaseChangelog } from ${JSON.stringify(new URL('./release.mjs', import.meta.url).href)};
      const requests = [];
      globalThis.fetch = async (url, options) => {
        assert.ok(String(url).startsWith('https://api.github.com/repos/fixture/contracts/releases'));
        requests.push({ url: String(url), method: options.method, body: options.body && JSON.parse(options.body) });
        if (options.method === 'GET') return new Response('{}', { status: 404 });
        assert.equal(options.method, 'POST');
        return new Response('{}', { status: 201 });
      };
      const projects = ['auth-contracts', 'forms-contracts'];
      const result = await releaseVersion({ projects, firstRelease: true, specifier: '0.0.1', dryRun: true, gitCommit: false, gitTag: false, stageChanges: false });
      // Same config boundary as runRelease: versionData is reused; the inert
      // version graph must not override the configured changelog client's graph.
      const options = { projects, versionData: result.projectsVersionData, firstRelease: true, gitCommit: false, gitTag: false, gitPush: false, stageChanges: false };
      const preview = await releaseChangelog({ ...options, dryRun: true });
      for (const project of projects) {
        assert.equal(typeof preview.projectChangelogs[project].postGitTask, 'function');
        assert.equal(preview.projectChangelogs[project].releaseVersion.gitTag, project + '@0.0.1');
      }
      assert.equal(requests.filter(r => r.method === 'GET').length, 2);
      assert.equal(requests.filter(r => r.method !== 'GET').length, 0);
      assert.equal(existsSync('packages/auth/CHANGELOG.md'), false);
      await releaseChangelog({ ...options, dryRun: false });
      const created = requests.filter(r => r.method === 'POST');
      assert.equal(created.length, 2);
      for (const [index, project] of projects.entries()) {
        assert.equal(created[index].body.tag_name, project + '@0.0.1');
        assert.equal(created[index].body.target_commitish, ${JSON.stringify(initialHead)});
        assert.equal(created[index].body.prerelease, false);
        assert.equal(created[index].body.body, readFileSync('packages/' + project.replace('-contracts', '') + '/CHANGELOG.md', 'utf8'));
      }
      console.log('Remote release requests verified without network access');
    `,
    ]);
    assert.match(output, /Remote release requests verified/);
    assert.equal(run('git', ['rev-parse', 'HEAD']).trim(), initialHead);
    assert.equal(run('git', ['tag']).trim(), '');
    // Existing and future Nx-generated notes remain byte-for-byte unchanged;
    // only these files are exempt from repository prose style rules.
    for (const path of ['.prettierignore', '.markdownlint-cli2.jsonc'])
      cpSync(path, join(directory, path));
    run(process.execPath, [
      '--input-type=module',
      '-e',
      `
      import assert from 'node:assert/strict';
      import { getFileInfo } from 'prettier';
      assert.equal((await getFileInfo('packages/auth/CHANGELOG.md', { ignorePath: '.prettierignore' })).ignored, true);
      assert.equal((await getFileInfo('packages/auth/README.md', { ignorePath: '.prettierignore' })).ignored, false);
    `,
    ]);
    write('README.md', '# Fixture\n');
    run(process.execPath, [
      'node_modules/markdownlint-cli2/markdownlint-cli2-bin.mjs',
    ]);
    write('README.md', 'Missing required heading\n');
    assert.throws(
      () =>
        run(process.execPath, [
          'node_modules/markdownlint-cli2/markdownlint-cli2-bin.mjs',
        ]),
      /MD041/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
