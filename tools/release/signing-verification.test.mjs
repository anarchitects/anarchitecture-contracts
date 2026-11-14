import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { parse } from 'yaml';

const workflow = parse(
  readFileSync('.github/workflows/verify-release-signing.yml', 'utf8'),
);
const script = workflow.jobs.verify.steps[0].run;
const passphrase = 'synthetic-test-passphrase';
let home;
let key;
let fingerprint;

function gpg(args, input) {
  const result = spawnSync('gpg', ['--homedir', home, '--batch', ...args], {
    input,
    encoding: 'utf8',
    timeout: 30_000,
  });
  assert.equal(result.status, 0, 'Synthetic GPG fixture operation failed');
  return result.stdout;
}

before(() => {
  // A short path keeps GPG agent socket paths within macOS limits.
  home = mkdtempSync('/tmp/contracts-gpg-');
  gpg(
    [
      '--pinentry-mode',
      'loopback',
      '--passphrase-fd',
      '0',
      '--quick-generate-key',
      'Synthetic verification <test@example.invalid>',
      'rsa2048',
      'sign',
      '1d',
    ],
    passphrase + '\n',
  );
  fingerprint = gpg(['--with-colons', '--list-secret-keys'])
    .split('\n')
    .find((line) => line.startsWith('fpr:'))
    .split(':')[9];
  key = gpg(
    [
      '--pinentry-mode',
      'loopback',
      '--passphrase-fd',
      '0',
      '--armor',
      '--export-secret-keys',
      fingerprint,
    ],
    passphrase + '\n',
  );
});

after(() => {
  if (!home) return;
  spawnSync('gpgconf', ['--homedir', home, '--kill', 'gpg-agent']);
  rmSync(home, { recursive: true, force: true });
});

function verify(overrides = {}) {
  const runnerTemp = mkdtempSync('/tmp/signing-test-');
  try {
    const result = spawnSync('bash', ['-c', script], {
      env: {
        ...process.env,
        RUNNER_TEMP: runnerTemp,
        GITHUB_REPOSITORY: 'anarchitects/anarchitecture-contracts',
        GITHUB_RUN_ID: 'synthetic',
        SIGNING_KEY: key,
        SIGNING_PASSPHRASE: passphrase,
        EXPECTED_FINGERPRINT: fingerprint,
        ...overrides,
      },
      encoding: 'utf8',
      timeout: 30_000,
    });
    assert.deepEqual(readdirSync(runnerTemp), [], 'Temporary keyring removed');
    assert.ok(!result.stdout.includes(passphrase));
    assert.ok(!result.stderr.includes(passphrase));
    assert.ok(!result.stdout.includes('BEGIN PGP PRIVATE KEY'));
    assert.ok(!result.stderr.includes('BEGIN PGP PRIVATE KEY'));
    return result;
  } finally {
    rmSync(runnerTemp, { recursive: true, force: true });
  }
}

test('signs and verifies with the expected protected identity, then cleans up', () => {
  const result = verify();
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    new RegExp(`Verified signing fingerprint: ${fingerprint}`),
  );
});

for (const [name, overrides] of [
  ['missing key', { SIGNING_KEY: '' }],
  ['malformed key', { SIGNING_KEY: 'invalid synthetic key' }],
  ['wrong passphrase', { SIGNING_PASSPHRASE: 'incorrect' }],
  ['wrong identity', { EXPECTED_FINGERPRINT: 'A'.repeat(40) }],
  ['invalid fingerprint input', { EXPECTED_FINGERPRINT: 'not-a-fingerprint' }],
]) {
  test(`rejects ${name} without leaking credentials or leaving a keyring`, () => {
    const result = verify(overrides);
    assert.notEqual(result.status, 0);
    assert.equal(
      result.stderr.trim(),
      'Protected signing verification failed.',
    );
  });
}

test('requires manual main approval with no repository permissions or checkout', () => {
  assert.deepEqual(Object.keys(workflow.on), ['workflow_dispatch']);
  assert.deepEqual(workflow.permissions, {});
  assert.equal(workflow.jobs.verify.environment, 'shared-bot-release');
  assert.equal(
    workflow.jobs.verify.if,
    "github.ref == 'refs/heads/main' && github.run_attempt == 1",
  );
  assert.equal(workflow.jobs.verify.steps.length, 1);
  assert.equal(workflow.jobs.verify.steps[0].uses, undefined);
});
