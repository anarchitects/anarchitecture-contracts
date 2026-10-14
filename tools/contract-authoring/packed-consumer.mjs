import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  rmSync,
  readdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const root = resolve('.');
const directory = mkdtempSync(join(tmpdir(), 'contracts-packed-'));
const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    cwd: directory,
    env: { ...process.env, npm_config_cache: join(directory, '.npm-cache') },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
try {
  const packs = [];
  for (const path of [
    'node_modules/zod',
    'packages/auth',
    'packages/identity',
    'packages/forms',
    'packages/newsletter',
  ]) {
    const [pack] = JSON.parse(
      run('npm', [
        'pack',
        resolve(path),
        '--ignore-scripts',
        '--json',
        '--pack-destination',
        directory,
      ]),
    );
    packs.push(join(directory, pack.filename));
    if (path.startsWith('packages/')) {
      for (const { path: name } of pack.files)
        assert.match(
          name,
          /^(dist\/|openapi\/|contract-manifest\.json$|package\.json$|README\.md$|LICENSE$|CHANGELOG\.md$)/,
          `${path}: unexpected packed file ${name}`,
        );
      for (const required of ['README.md', 'LICENSE', 'package.json'])
        assert.ok(
          pack.files.some(({ path: name }) => name === required),
          `${path}: missing ${required}`,
        );
    }
  }
  writeFileSync(
    join(directory, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }),
  );
  run('npm', [
    'install',
    '--offline',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--package-lock=false',
    ...packs,
  ]);
  const runtime = `
    import assert from 'node:assert/strict';
    import { createRequire } from 'node:module';
    import { readFileSync } from 'node:fs';
    const require = createRequire(import.meta.url);
    for (const domain of ['auth', 'identity', 'forms', 'newsletter']) {
      const name = '@anarchitects/' + domain + '-contracts';
      const pkg = JSON.parse(readFileSync(new URL('./node_modules/' + name + '/package.json', import.meta.url), 'utf8'));
      for (const subpath of Object.keys(pkg.exports)) {
        const specifier = subpath === '.' ? name : name + subpath.slice(1);
        if (typeof pkg.exports[subpath] === 'string') {
          const target = require.resolve(specifier);
          const content = readFileSync(target, 'utf8');
          assert.ok(content.length > 0);
          if (subpath.endsWith('.json')) {
            const artifact = JSON.parse(content);
            if (subpath === './manifest.json') {
              assert.equal(artifact.status, 'canonical');
              assert.equal(artifact.formatVersion, 2);
              assert.equal(artifact.artifactKind, 'canonical-contract');
              assert.equal(artifact.implementationConformance.status, 'unverified');
              assert.equal(artifact.deploymentCompliance.status, 'unverified');
              assert.deepEqual(artifact.supportedCapabilities, []);
              assert.equal(artifact.packages[name], pkg.version);
              const { createHash } = await import('node:crypto');
              for (const [file, hash] of Object.entries(artifact.artifacts)) {
                const bytes = readFileSync(new URL('./node_modules/' + name + '/openapi/' + file, import.meta.url));
                assert.equal(createHash('sha256').update(bytes).digest('hex'), hash);
              }
            }
          }
          continue;
        }
        const esm = await import(specifier), cjs = require(specifier);
        assert.deepEqual(Object.keys(esm).sort(), Object.keys(cjs).sort(), specifier);
      }
      const esm = await import(name), cjs = require(name);
      if (domain === 'auth') {
        const config = structuredClone(esm.DefaultAuthContractConfig);
        config.login.password.minLength = 3;
        for (const entry of [esm, cjs]) {
          const configured = entry.createAuthContracts(config);
          assert.equal(configured.loginRequestSchema.parse({ credential: 'reader', password: 1234 }).password, '1234');
          assert.equal(configured.config.login.password.minLength, 3);
        }
      }
      if (domain === 'forms') {
        for (const entry of [esm, cjs]) {
          const response = entry.getFormDefinition.responses[200].body.content['application/json'];
          assert.equal(response, entry.PublicFormDefinitionEnvelopeResponseSchema);
          const safe = { config: { id: 'contact', version: 1, fields: [] }, schema: {} };
          assert.deepEqual(response.parse(safe), safe);
          const leaked = { ...safe, config: { ...safe.config, delivery: { webhooks: [{ url: 'https://example.test/hook', secret: 'test-only' }] } } };
          assert.equal(entry.FormDefinitionEnvelopeResponseSchema.safeParse(leaked).success, true);
          assert.equal(response.safeParse(leaked).success, false);
        }
      }
      const [schemaName, input] = {
        auth: ['LoginRequestSchema', { credential: 123456, password: 123456 }],
        identity: ['CreateUserProfileRequestSchema', { authUserId: 123, displayName: null }],
        forms: ['SubmissionRequestSchema', { formId: 123, formVersion: '2', payload: {} }],
        newsletter: ['NewsletterSubscribeRequestSchema', { website: 'bot' }],
      }[domain];
      assert.deepEqual(esm[schemaName].parse(input), cjs[schemaName].parse(input));
      assert.throws(() => require(name + '/src/index'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
    }
    console.log('Packed ESM/CommonJS exports and parsing passed on ' + process.version);
  `;
  writeFileSync(join(directory, 'runtime.mjs'), runtime);
  console.log(run(process.execPath, ['runtime.mjs']).trim());
  // CI's Node 22/24 matrix runs this same installed-artifact check. A second
  // local Node binary can also be supplied without changing the test fixture.
  if (process.env.CONTRACTS_NODE22_BIN)
    console.log(run(process.env.CONTRACTS_NODE22_BIN, ['runtime.mjs']).trim());

  for (const domain of ['auth', 'identity', 'forms', 'newsletter']) {
    const base = join(
      directory,
      'node_modules',
      '@anarchitects',
      `${domain}-contracts`,
    );
    const pkg = read(join(base, 'package.json'));
    assert.deepEqual(pkg.dependencies, { zod: '4.5.0' });
    assert.equal(pkg.peerDependencies, undefined);
    for (const format of ['esm', 'cjs'])
      for (const file of readdirSync(join(base, 'dist', format))) {
        const text = readFileSync(join(base, 'dist', format, file), 'utf8');
        assert.doesNotMatch(
          text,
          /(?:from\s+|import\s*\(|require\s*\()\s*['"](?:node:|@nestjs|@angular|@nx|fastify|express|ajv|@sinclair|.*tools\/contract-authoring)/,
          `${domain}/${file}`,
        );
      }
  }
  const installed = readdirSync(join(directory, 'node_modules'))
    .filter((name) => !name.startsWith('.'))
    .sort();
  assert.deepEqual(installed, ['@anarchitects', 'zod']);

  const types = `
    import { LoginRequestSchema, login, type LoginRequestInput, type LoginRequest, type AuthOperation } from '@anarchitects/auth-contracts';
    import { createAuthContracts, DefaultAuthContractConfig, type AuthContractConfig } from '@anarchitects/auth-contracts';
    const configured = createAuthContracts({ ...DefaultAuthContractConfig, login: { ...DefaultAuthContractConfig.login, password: { required: false, emptyStringPolicy: 'strip' } } });
    const optionalPassword: string | undefined = configured.loginRequestSchema.parse({ credential: 'reader' }).password;
    // @ts-expect-error optional configuration cannot promise a required password
    const requiredPassword: string = configured.loginRequestSchema.parse({ credential: 'reader' }).password;
    const completeConfig: AuthContractConfig = DefaultAuthContractConfig;
    const defaultPassword: string = createAuthContracts().loginRequestSchema.parse({ credential: 'reader', password: '123456' }).password;
    void [optionalPassword, requiredPassword, completeConfig, defaultPassword];
    import { JwtTokensResponseSchema } from '@anarchitects/auth-contracts/jwt';
    import { PolicyRuleSchema } from '@anarchitects/auth-contracts/policy';
    import { PasskeyRegistrationFinishRequestSchema } from '@anarchitects/auth-contracts/passkeys';
    import { CreateUserProfileRequestSchema, type CreateUserProfileRequestInput, type UserProfileResponse } from '@anarchitects/identity-contracts';
    import { SubmissionRequestSchema, submitForm, type SubmissionRequestInput, type SubmissionRequest } from '@anarchitects/forms-contracts';
    import { NewsletterSubscriptionRequestSchema, type NewsletterSubscriptionRequest } from '@anarchitects/newsletter-contracts';
    import { NewsletterNativeActionRequestSchema, confirmNewsletterSubscription } from '@anarchitects/newsletter-contracts/native';
    import { NewsletterWebhookPayloadSchema, receiveNewsletterWebhook } from '@anarchitects/newsletter-contracts/webhook';
    const formRaw: SubmissionRequestInput = { formId: 123, formVersion: '2', payload: {} };
    const formParsed: SubmissionRequest = SubmissionRequestSchema.parse(formRaw);
    const version: number = formParsed.formVersion;
    const formPath: '/forms/submit' = submitForm.path;
    const actionPath: '/newsletter/confirm' = confirmNewsletterSubscription.path;
    const rawKind: 'raw' = receiveNewsletterWebhook.requestBody.kind;
    const subscribed: NewsletterSubscriptionRequest = NewsletterSubscriptionRequestSchema.parse({ email: 'a@b.c', consent: true, consentVersion: 'v1' });
    const consent: true = subscribed.consent;
    // @ts-expect-error request consent cannot be a string
    const badConsent: NewsletterSubscriptionRequest = { email: 'a@b.c', consent: 'true', consentVersion: 'v1' };
    // @ts-expect-error parsed formVersion cannot be a string
    const badVersion: string = formParsed.formVersion;
    void [version, formPath, actionPath, rawKind, consent, badConsent, badVersion, NewsletterNativeActionRequestSchema, NewsletterWebhookPayloadSchema];
    const raw: LoginRequestInput = { credential: 123456, password: ['password'] };
    const parsed: LoginRequest = LoginRequestSchema.parse(raw);
    const text: string = parsed.password;
    const method: 'POST' = login.method;
    const path: '/auth/login' = login.path;
    const operation: AuthOperation = login;
    const identity: CreateUserProfileRequestInput = { authUserId: 123, displayName: null };
    const owner: string = CreateUserProfileRequestSchema.parse(identity).authUserId;
    // @ts-expect-error parsed password is a string, never the raw number
    const number: number = parsed.password;
    // @ts-expect-error required nullable response fields cannot be omitted
    const incomplete: UserProfileResponse = { id: 'p', authUserId: 'u' };
    void [text, method, path, operation, owner, number, incomplete, JwtTokensResponseSchema, PolicyRuleSchema, PasskeyRegistrationFinishRequestSchema];
  `;
  writeFileSync(join(directory, 'consumer.mts'), types);
  writeFileSync(
    join(directory, 'consumer.cts'),
    `import auth = require('@anarchitects/auth-contracts');\nimport identity = require('@anarchitects/identity-contracts');\nconst method: 'POST' = auth.login.method;\nconst value: string = identity.CreateUserProfileRequestSchema.parse({ authUserId: 123 }).authUserId;\nimport forms = require('@anarchitects/forms-contracts');\nimport newsletter = require('@anarchitects/newsletter-contracts');\nconst version: number = forms.SubmissionRequestSchema.parse({formId: 'x', formVersion: '2', payload: {}}).formVersion;\nconst accepted: true = newsletter.NewsletterAcceptedResponseSchema.parse({accepted: true}).accepted;\nvoid [method, value, version, accepted];\n`,
  );
  for (const [resolution, files] of [
    ['NodeNext', ['consumer.mts', 'consumer.cts']],
    ['Bundler', ['consumer.mts']],
  ]) {
    writeFileSync(
      join(directory, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: resolution === 'NodeNext' ? 'NodeNext' : 'ESNext',
          moduleResolution: resolution,
          lib: ['ES2022', 'DOM'],
          strict: true,
          noEmit: true,
          skipLibCheck: false,
        },
        files,
      }),
    );
    for (const compiler of ['typescript', 'typescript-5-5']) {
      try {
        run(process.execPath, [
          join(root, 'node_modules', compiler, 'bin/tsc'),
          '-p',
          'tsconfig.json',
        ]);
      } catch (error) {
        throw new Error(`${compiler}/${resolution}: ${error.stdout}`, {
          cause: error,
        });
      }
    }
  }
  writeFileSync(
    join(directory, 'browser.mjs'),
    `export { LoginRequestSchema, authOperations } from '@anarchitects/auth-contracts';\nexport { identityOperations } from '@anarchitects/identity-contracts';\nexport { formsOperations } from '@anarchitects/forms-contracts';\nexport { newsletterOperations } from '@anarchitects/newsletter-contracts';\n`,
  );
  const bundle = await build({
    entryPoints: [join(directory, 'browser.mjs')],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    target: 'es2022',
    write: false,
    metafile: true,
  });
  assert.ok(bundle.outputFiles[0].contents.length);
  assert.ok(
    !Object.keys(bundle.metafile.inputs).some((name) =>
      /@nestjs|@angular|ajv|fastify|express/.test(name),
    ),
  );
  console.log(
    'Clean packed dependency boundary, TypeScript 5.5/6 NodeNext + bundler consumers, and browser bundle passed.',
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
