import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import YAML from 'yaml';
import { releaseOptions } from './release.mjs';
import { releaseProjects } from './projects.mjs';

test('release input is an explicit project list and SemVer, never shell syntax or Nx globs', () => {
  assert.deepEqual(releaseOptions({}).projects, Object.keys(releaseProjects));
  assert.deepEqual(
    releaseOptions({ projects: 'auth-contracts, identity-contracts' }).projects,
    ['auth-contracts', 'identity-contracts'],
  );
  for (const projects of [
    '*',
    'contract-checks',
    'auth-contracts,',
    'auth-contracts,auth-contracts',
    '$(touch /tmp/unwanted)',
  ]) {
    assert.throws(() => releaseOptions({ projects }));
  }
  for (const specifier of [
    'latest',
    '--git-push',
    '1.0',
    '1.0.0; echo bad',
    '1.0.0\n',
  ]) {
    assert.throws(() => releaseOptions({ specifier }));
  }
  for (const specifier of [
    'patch',
    'minor',
    'major',
    'prepatch',
    'preminor',
    'premajor',
    'prerelease',
    '1.0.0-next.1',
  ])
    assert.equal(releaseOptions({ specifier }).specifier, specifier);
  assert.equal(releaseOptions({}).specifier, undefined);
});

test('first release permits only the exact 0.0.1 specifier or the automatic initial default', () => {
  for (const specifier of ['', '0.0.1'])
    assert.doesNotThrow(() =>
      releaseOptions({ 'first-release': true, specifier }),
    );
  for (const specifier of ['patch', 'minor', '0.1.0', '0.0.1-beta.0'])
    assert.throws(
      () => releaseOptions({ 'first-release': true, specifier }),
      /exactly 0.0.1/,
    );
});

const workflow = YAML.parse(
  readFileSync('.github/workflows/publish.yml', 'utf8'),
);
const resolveStep = workflow.jobs.publish.steps.find(
  (step) => step.id === 'release',
);
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const resolveTag = new AsyncFunction(
  'github',
  'context',
  'core',
  'process',
  resolveStep.with.script,
);

test('publish resolves only a published, signed tag and signed commit to an immutable SHA', async () => {
  const outputs = {};
  const fixtures = {
    release: { published_at: '2026-10-13T00:00:00Z', draft: false },
    ref: { object: { type: 'tag', sha: 'a'.repeat(40) } },
    tag: {
      verification: { verified: true },
      object: { type: 'commit', sha: 'b'.repeat(40) },
    },
    commit: { verification: { verified: true } },
  };
  const github = {
    rest: {
      repos: { getReleaseByTag: async () => ({ data: fixtures.release }) },
      git: {
        getRef: async () => ({ data: fixtures.ref }),
        getTag: async () => ({ data: fixtures.tag }),
        getCommit: async () => ({ data: fixtures.commit }),
      },
    },
  };
  const execute = (tag = 'auth-contracts@0.1.0') =>
    resolveTag(
      github,
      { repo: { owner: 'anarchitects', repo: 'anarchitecture-contracts' } },
      {
        setOutput: (k, v) => {
          outputs[k] = v;
        },
      },
      { env: { RELEASE_TAG: tag } },
    );
  await execute();
  assert.equal(outputs.sha, 'b'.repeat(40));
  assert.equal(outputs.project, 'auth-contracts');
  assert.equal(outputs['dist-tag'], 'latest');
  await execute('auth-contracts@0.1.0-next.1');
  assert.equal(outputs['dist-tag'], 'next');
  for (const tag of [
    'main',
    'contract-checks@1.0.0',
    'auth-contracts@01.0.0',
    'auth-contracts@0.1.0\n',
    'auth-contracts@$(echo bad)',
  ])
    await assert.rejects(execute(tag));
  fixtures.release.draft = true;
  await assert.rejects(execute(), /published/);
  fixtures.release.draft = false;
  fixtures.ref.object.type = 'commit';
  await assert.rejects(execute(), /annotated tag/);
  fixtures.ref.object.type = 'tag';
  fixtures.tag.verification.verified = false;
  await assert.rejects(execute(), /tag signature/);
  fixtures.tag.verification.verified = true;
  fixtures.commit.verification.verified = false;
  await assert.rejects(execute(), /commit signature/);
});

test('the standard Nx publisher is preceded by the explicit publication gate', () => {
  const steps = workflow.jobs.publish.steps;
  const gate = steps.findIndex((s) => s.run?.includes(':publication-check'));
  const publish = steps.findIndex((s) => s.run?.includes('nx release publish'));
  assert.ok(gate >= 0 && publish > gate);
  assert.equal(workflow.permissions['id-token'], 'write');
  for (const project of Object.keys(releaseProjects)) {
    const config = JSON.parse(
      readFileSync(
        `packages/${project.replace(/-contracts$/, '')}/project.json`,
        'utf8',
      ),
    );
    assert.equal(
      config.targets['nx-release-publish'].executor,
      '@nx/js:release-publish',
    );
  }
});
