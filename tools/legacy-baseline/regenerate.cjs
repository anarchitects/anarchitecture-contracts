// Execute the pinned legacy generator unchanged in an isolated Git archive.
const { copyFileSync, mkdirSync } = require('node:fs');
const { join, resolve } = require('node:path');
const childProcess = require('node:child_process');
const { loadSource } = require('./source.cjs');

const destination = resolve(process.argv[3]);
const legacy = loadSource(process.argv[2]);
const execFileSync = childProcess.execFileSync;
// The archived workspace reuses installed tools without creating a second Yarn
// install state. Only the formatter launcher is adapted, not generation logic.
childProcess.execFileSync = (command, args, options) => {
  if (command === 'yarn' && args[0] === 'prettier') {
    const bin = join(legacy.root, 'node_modules/prettier/bin/prettier.cjs');
    return execFileSync(process.execPath, [bin, ...args.slice(1)], options);
  }
  return execFileSync(command, args, options);
};
process.chdir(legacy.root);
process.once('beforeExit', () => {
  mkdirSync(destination, { recursive: true });
  for (const extension of ['json', 'yaml']) {
    copyFileSync(
      join(legacy.root, `docs/openapi/openapi.${extension}`),
      join(destination, `regenerated-openapi.${extension}`),
    );
  }
  legacy.dispose();
});
legacy.source('tools/api-specs/generate.ts');
