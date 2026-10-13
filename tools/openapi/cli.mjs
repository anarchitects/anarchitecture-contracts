import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
} from 'node:fs';
import { join } from 'node:path';
import { loadDomains } from './model.mjs';
import { generate, reviewProfile } from './generate.mjs';
import { compareLegacy, checkReleasePlans } from './compatibility.mjs';
import { json, readJson, invariant } from './common.mjs';

const [command = 'check', ...args] = process.argv.slice(2);
const models = await loadDomains();
const proposal = readJson('tools/openapi/projection-proposal.json');
const expected = new Map();
if (command === 'release' || command === 'verify-profile') {
  invariant(
    args.length === 2,
    'Usage: release <approved-profile.json> <output-directory>',
  );
  const result = await generate(models, {
    profile: readJson(args[0]),
    proposal,
    verification: command === 'verify-profile',
  });
  invariant(!existsSync(args[1]), 'Release output directory must not exist');
  mkdirSync(args[1], { recursive: true });
  writeFileSync(
    join(args[1], `${result.manifest.profile.id}.json`),
    result.jsonText,
  );
  writeFileSync(
    join(args[1], `${result.manifest.profile.id}.yaml`),
    result.yamlText,
  );
  writeFileSync(join(args[1], 'inventory.json'), result.inventoryText);
  writeFileSync(join(args[1], 'manifest.json'), json(result.manifest));
} else if (command === 'compatibility') {
  invariant(args.length === 1, 'Usage: compatibility <base-git-ref>');
  console.log(json(checkReleasePlans(models, args[0])));
} else {
  invariant(
    ['check', 'write'].includes(command) && args.length === 0,
    'Usage: [check|write|compatibility <base-ref>|release <profile> <output>|verify-profile <profile> <output>]',
  );
  const inventories = [];
  for (const group of [...models.map((model) => [model]), models]) {
    const result = await generate(group, {
      profile: reviewProfile(group),
      proposal,
      review: true,
    });
    const directory =
      group.length === 1 ? `packages/${group[0].domain}` : 'generated';
    const base = `${directory}/openapi`,
      id = result.manifest.profile.id;
    expected.set(`${base}/${id}.json`, result.jsonText);
    expected.set(`${base}/${id}.yaml`, result.yamlText);
    expected.set(`${base}/inventory.json`, result.inventoryText);
    expected.set(`${directory}/contract-manifest.json`, json(result.manifest));
    if (group.length === 1) inventories.push(result.inventory);
    console.log(
      `${id}: ${result.manifest.operationCount} inventoried, ${result.manifest.documentedOperationCount} in paths, release blocked`,
    );
  }
  const comparison = compareLegacy(
    models,
    readJson('baselines/legacy-3tier/routes.json'),
    readJson('baselines/legacy-3tier/regenerated-openapi.json'),
    inventories,
  );
  expected.set(
    'generated/baseline-comparison.json',
    json({
      status: 'review-only',
      baselineRevision: 'ecda1b6e0d9bc39c66373452a92dce91e06abee0',
      note: 'Structural comparison is not semantic equivalence. Existing differential and frozen HTTP tests remain mandatory; projection exceptions are scoped and reviewed; host bindings remain unverified.',
      operations: comparison,
    }),
  );
  const directories = [
    ...models.map((model) => `packages/${model.domain}/openapi`),
    'generated/openapi',
  ];
  for (const directory of directories)
    if (existsSync(directory))
      for (const file of readdirSync(directory))
        invariant(
          expected.has(`${directory}/${file}`),
          `Unexpected generated artifact: ${directory}/${file}`,
        );
  for (const [path, bytes] of expected) {
    if (command === 'write') {
      mkdirSync(join(path, '..'), { recursive: true });
      writeFileSync(path, bytes);
    } else
      invariant(
        existsSync(path) && readFileSync(path, 'utf8') === bytes,
        `Generated drift: ${path}; run yarn openapi:generate and review the diff`,
      );
  }
  console.log(
    `${command === 'write' ? 'Wrote' : 'Verified'} ${expected.size} deterministic artifacts.`,
  );
}
