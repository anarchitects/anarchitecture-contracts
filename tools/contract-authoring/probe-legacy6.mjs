import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { legacy6Cases } from './legacy6-cases.mjs';

const require = createRequire(import.meta.url);
const { loadSource } = require('../legacy-baseline/source.cjs');
const { executeCase } = require('../legacy-baseline/runtime.cjs');
const [checkout, mode = 'verify'] = process.argv.slice(2);
if (!checkout || !['record', 'verify'].includes(mode))
  throw new Error(
    'Usage: node tools/contract-authoring/probe-legacy6.mjs <3-tier-checkout> [verify|record]',
  );
const source = loadSource(checkout);
const destination = new URL(
  '../../packages/newsletter/compatibility/legacy-http.json',
  import.meta.url,
);
const paths = [
  'libs/newsletter/nest/src/infrastructure-mailerlite/mailerlite-webhook.adapter.ts',
  'libs/newsletter/nest/src/presentation/newsletter-presentation.module.ts',
  'libs/newsletter/nest/src/presentation/newsletter-native.controller.ts',
  'libs/forms/nest/src/presentation/controllers/forms.controller.ts',
];
try {
  const result = {
    revision: source.revision,
    sourceHashes: Object.fromEntries(
      paths.map((path) => [
        path,
        createHash('sha256')
          .update(readFileSync(resolve(source.root, path)))
          .digest('hex'),
      ]),
    ),
    cases: [],
  };
  for (const item of legacy6Cases) {
    result.cases.push({ ...item, observed: await executeCase(source, item) });
    console.log(
      `${item.id}: ${result.cases
        .at(-1)
        .observed.responses.map(({ status }) => status)
        .join(',')}`,
    );
  }
  if (mode === 'record')
    writeFileSync(destination, JSON.stringify(result, null, 2) + '\n');
  else assert.deepEqual(result, JSON.parse(readFileSync(destination, 'utf8')));
} finally {
  source.dispose();
}
