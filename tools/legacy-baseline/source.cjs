// Audit adapter only. No framework dependency is installed in Contracts.
const { createRequire } = require('node:module');
const {
  readFileSync,
  mkdtempSync,
  symlinkSync,
  rmSync,
  realpathSync,
} = require('node:fs');
const { resolve, join } = require('node:path');
const { execFileSync } = require('node:child_process');
const { tmpdir } = require('node:os');

const revision = 'ecda1b6e0d9bc39c66373452a92dce91e06abee0';

function loadSource(directory) {
  const checkout = resolve(directory);
  const git = (...args) =>
    execFileSync('git', ['-C', checkout, ...args], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    }).trim();
  if (git('rev-parse', `${revision}^{commit}`) !== revision)
    throw new Error(`Expected 3-tier revision ${revision}`);
  // Audit immutable Git contents even if another task is editing the checkout.
  const root = realpathSync(
    mkdtempSync(join(tmpdir(), 'contracts-legacy-source-')),
  );
  const archive = execFileSync('git', ['-C', checkout, 'archive', revision], {
    maxBuffer: 64 * 1024 * 1024,
  });
  execFileSync('tar', ['-xf', '-', '-C', root], { input: archive });
  symlinkSync(
    join(checkout, 'node_modules'),
    join(root, 'node_modules'),
    'dir',
  );
  const requireSource = createRequire(join(root, 'package.json'));
  // Match the source's ts-jest source-test semantics, including decorator metadata.
  // This is not a packed ESM/CJS consumer compatibility test.
  requireSource('ts-node').register({
    project: join(root, 'tsconfig.base.json'),
    transpileOnly: true,
    experimentalResolver: true,
    moduleTypes: { [`${root}/**/*`]: 'cjs' },
    compilerOptions: {
      module: 'CommonJS',
      moduleResolution: 'Node',
      ignoreDeprecations: '6.0',
    },
  });
  requireSource('tsconfig-paths').register({
    baseUrl: root,
    paths: JSON.parse(readFileSync(join(root, 'tsconfig.base.json'), 'utf8'))
      .compilerOptions.paths,
  });
  requireSource('reflect-metadata');
  const source = (file) => requireSource(`./${file}`);
  return {
    root,
    git,
    source,
    requireSource,
    revision,
    dispose: () => rmSync(root, { recursive: true, force: true }),
  };
}

module.exports = { loadSource, revision };
