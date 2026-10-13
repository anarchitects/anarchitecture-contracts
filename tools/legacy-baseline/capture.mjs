import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  mkdtempSync,
  rmSync,
  existsSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import sourceAdapter from './source.cjs';
import runtime from './runtime.cjs';
import cases from './cases.cjs';

const here = dirname(fileURLToPath(import.meta.url));
const baseline = resolve(here, '../../baselines/legacy-3tier');
const [mode, sourcePath, outputPath] = process.argv.slice(2);
if (
  !['capture', 'verify'].includes(mode) ||
  !sourcePath ||
  (mode === 'capture' && !outputPath)
) {
  throw new Error(
    'Usage: node tools/legacy-baseline/capture.mjs capture <3-tier-checkout> <new-output-directory> | verify <3-tier-checkout>',
  );
}
const output =
  mode === 'verify'
    ? mkdtempSync(join(tmpdir(), 'contracts-legacy-verify-'))
    : resolve(outputPath);
if (mode === 'capture' && existsSync(output))
  throw new Error(
    'Capture requires a new directory; frozen evidence is never overwritten implicitly.',
  );
mkdirSync(output, { recursive: true });
const hash = (data) => createHash('sha256').update(data).digest('hex');
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
const write = (name, value) =>
  writeFileSync(
    join(output, name),
    `${JSON.stringify(canonical(value), null, 2)}\n`,
  );
const legacy = sourceAdapter.loadSource(sourcePath);

function versions() {
  const dependencies = {};
  for (const name of [
    'typescript',
    'ts-node',
    'tsconfig-paths',
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/testing',
    '@nestjs/platform-fastify',
    '@nestjs/jwt',
    '@sinclair/typebox',
    '@fastify/swagger',
    '@fastify/swagger-ui',
    'prettier',
    'yaml',
  ]) {
    let directory = dirname(legacy.requireSource.resolve(name));
    while (directory !== dirname(directory)) {
      const file = join(directory, 'package.json');
      if (existsSync(file)) {
        const pkg = JSON.parse(readFileSync(file, 'utf8'));
        if (pkg.name === name) {
          dependencies[name] = pkg.version;
          break;
        }
      }
      directory = dirname(directory);
    }
    assert.ok(dependencies[name], `Missing installed version for ${name}`);
  }
  // Fastify and its validator can be nested beneath the adapter; record the
  // actual packages it resolves, not a possibly different hoisted root version.
  const adapterRequire = createRequire(
    legacy.requireSource.resolve('@nestjs/platform-fastify'),
  );
  const fastifyRequire = createRequire(adapterRequire.resolve('fastify'));
  dependencies.fastify = fastifyRequire('./package.json').version;
  const compilerRequire = createRequire(
    fastifyRequire.resolve('@fastify/ajv-compiler'),
  );
  dependencies['@fastify/ajv-compiler'] =
    compilerRequire('./package.json').version;
  dependencies.ajv = compilerRequire('ajv/package.json').version;
  return dependencies;
}

try {
  const files = legacy
    .git('ls-tree', '-r', '--name-only', legacy.revision)
    .split('\n')
    .filter(
      (file) =>
        /^(package\.json|yarn\.lock|tsconfig\.base\.json)$/.test(file) ||
        /^(tools\/api-specs\/|docs\/openapi\/)/.test(file) ||
        /^(docs\/adr\/|docs\/guides\/ts-contracts\.md$|AGENTS\.md$)/.test(
          file,
        ) ||
        /^libs\/(auth|forms|identity|newsletter)\/(ts\/|nest\/|declarations\/|angular\/(data-access|config)\/)/.test(
          file,
        ) ||
        /^libs\/common\/nest\/mailer\//.test(file),
    );
  const sourceFiles = Object.fromEntries(
    files.map((file) => [file, hash(readFileSync(join(legacy.root, file)))]),
  );
  for (const extension of ['json', 'yaml']) {
    writeFileSync(
      join(output, `committed-openapi.${extension}`),
      readFileSync(join(legacy.root, `docs/openapi/openapi.${extension}`)),
    );
  }
  writeFileSync(
    join(output, 'committed-operation-snapshot.json'),
    readFileSync(join(legacy.root, 'tools/api-specs/openapi.snapshot.json')),
  );
  write(
    'route-metadata.json',
    legacy.source('tools/api-specs/route-metadata.ts').OPERATION_ID_MAP,
  );
  write('routes.json', runtime.inventory(legacy));
  execFileSync(
    process.execPath,
    [join(here, 'regenerate.cjs'), resolve(sourcePath), output],
    { stdio: 'pipe', maxBuffer: 4 * 1024 * 1024 },
  );
  const observations = [];
  for (const fixture of cases) {
    const observed = await runtime.executeCase(legacy, fixture);
    assert.deepEqual(
      observed.responses.map((response) => response.status),
      fixture.statuses,
      `${fixture.id}: unexpected HTTP status; inspect the implementation before changing the fixture`,
    );
    observations.push({ ...fixture, observed });
  }
  write('http.json', observations);
  const harnessFiles = Object.fromEntries(
    [
      'source.cjs',
      'runtime.cjs',
      'cases.cjs',
      'regenerate.cjs',
      'capture.mjs',
    ].map((file) => [file, hash(readFileSync(join(here, file)))]),
  );
  write('provenance.json', {
    kind: 'legacy-implementation-evidence',
    repository: 'https://github.com/anarchitects/anarchitecture-bricks-3tier',
    revision: legacy.revision,
    metaRevision: 'e2f34553c6e2492d0ab6f80ac795de44fc592a70',
    node: process.versions.node,
    dependencies: versions(),
    sourceFiles,
    harnessFiles,
    artifacts: Object.fromEntries(
      readdirSync(output)
        .sort()
        .map((file) => [file, hash(readFileSync(join(output, file)))]),
    ),
    limitations: [
      'Source-level Nest/Fastify HTTP replay, not a packed-consumer or production-host test.',
      'Auth engine, hashing, storage and passkey verifier are controlled ports; provider cookie issuance and WebAuthn cryptography are not verified.',
      'JWT signing/verification and Newsletter HMAC verification use real libraries with public fixture secrets.',
      'Newsletter native action ports are controlled; token lifecycle, database transactions and durable deduplication are not verified.',
      'Date/connection/content-length headers are excluded; Newsletter evidence timestamps are normalized to <clock>.',
      'Angular consumers are source-audited, not executed by this replay.',
    ],
  });
  if (mode === 'verify') {
    for (const file of readdirSync(output)) {
      assert.deepEqual(
        readFileSync(join(output, file)),
        readFileSync(join(baseline, file)),
        `Frozen baseline drift: ${file}`,
      );
    }
    console.log(
      `Verified pinned source, generator and ${cases.length} HTTP scenarios against frozen evidence.`,
    );
  } else
    console.log(
      `Captured ${cases.length} HTTP scenarios and legacy source evidence in ${output}`,
    );
} finally {
  legacy.dispose();
  if (mode === 'verify') rmSync(output, { recursive: true, force: true });
}
