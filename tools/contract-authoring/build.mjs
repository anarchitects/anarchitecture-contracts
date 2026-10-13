import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { domains, invariant, json, sourceFiles } from '../openapi/common.mjs';

const root = process.cwd();
const selected = process.argv.slice(2);
invariant(
  selected.every((domain) => domains.includes(domain)),
  'Unknown contract domain',
);
for (const domain of selected.length ? selected : domains) {
  execFileSync(
    process.execPath,
    [
      'node_modules/typescript/bin/tsc',
      '--noEmit',
      '-p',
      `packages/${domain}/tsconfig.json`,
    ],
    { stdio: 'inherit' },
  );
  for (const format of ['esm', 'cjs']) {
    // A separate process resolves package type and all build workers consistently.
    execFileSync(
      process.execPath,
      [
        resolve(root, 'node_modules/tsup/dist/cli-default.js'),
        '--config',
        resolve(root, 'tools/contract-authoring/tsup.config.mjs'),
        '--format',
        format,
        '--out-dir',
        `dist/${format}`,
      ],
      { cwd: resolve(root, 'packages', domain), stdio: 'inherit' },
    );
  }
  console.log(`Built ${domain} ESM/CommonJS and declarations.`);
  writeFileSync(
    `packages/${domain}/dist/build-inputs.json`,
    json(sourceFiles(domain)),
  );
}
