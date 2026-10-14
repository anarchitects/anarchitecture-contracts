import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
} from 'node:fs';
import { join } from 'node:path';
import { loadDomains } from './model.mjs';
import { canonicalArtifacts, hostArtifacts } from './artifacts.mjs';
import { generate, reviewProfile } from './generate.mjs';
import { compareLegacy } from './compatibility.mjs';
import { json, readJson, invariant } from './common.mjs';

const [command = 'check', ...args] = process.argv.slice(2);
const models = await loadDomains();
const proposal = readJson('tools/openapi/projection-proposal.json');
const expected = new Map();
if (command === 'configured-review') {
  invariant(
    args.length === 3,
    'Usage: configured-review <auth-config.json> <reviewed-projections.json> <output-directory>',
  );
  const auth = models.filter((model) => model.domain === 'auth');
  const result = await generate(auth, {
    profile: {
      ...reviewProfile(auth),
      id: 'auth-configured-review',
      authConfig: readJson(args[0]),
    },
    proposal: readJson(args[1]),
    review: true,
  });
  invariant(!existsSync(args[2]), 'Configured output directory must not exist');
  mkdirSync(args[2], { recursive: true });
  writeFileSync(join(args[2], 'auth-configured-review.json'), result.jsonText);
  writeFileSync(join(args[2], 'auth-configured-review.yaml'), result.yamlText);
  writeFileSync(join(args[2], 'inventory.json'), result.inventoryText);
  writeFileSync(join(args[2], 'manifest.json'), json(result.manifest));
} else if (command === 'release' || command === 'verify-profile') {
  invariant(
    args.length === 2 || args.length === 3,
    'Usage: release|verify-profile <profile.json> <output-directory> [reviewed-projections.json]',
  );
  const result = await hostArtifacts(models, {
    profile: readJson(args[0]),
    proposal: args[2] ? readJson(args[2]) : proposal,
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
  const { checkCompatibility } = await import('../release/compatibility.mjs');
  console.log(json(await checkCompatibility(models, args[0])));
} else {
  invariant(
    ['check', 'write'].includes(command) && args.length === 0,
    'Usage: [check|write|compatibility <base-ref>|release <profile> <output>|verify-profile <profile> <output>]',
  );
  const inventories = [];
  for (const group of [...models.map((model) => [model]), models]) {
    const result = await canonicalArtifacts(group, proposal);
    const directory =
      group.length === 1 ? `packages/${group[0].domain}` : 'generated';
    const base = `${directory}/openapi`,
      id = result.manifest.profile.id;
    for (const [name, bytes] of result.artifacts)
      expected.set(`${base}/${name}`, bytes);
    expected.set(`${directory}/contract-manifest.json`, json(result.manifest));
    if (group.length === 1) inventories.push(result.inventory);
    console.log(
      `${id}: ${result.manifest.operationCount} inventoried, ${result.manifest.documentedOperationCount} in paths, canonical contract; no host support claimed`,
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
