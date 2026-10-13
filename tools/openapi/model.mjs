import { z } from 'zod';
import {
  applyFidelity,
  webhookFidelity,
  utf16Check,
  utf16Limit,
} from './fidelity.mjs';
import { authorizeProjection, generatorDigest } from './projection-review.mjs';
import {
  domains,
  readJson,
  digest,
  json,
  sourceFiles,
  invariant,
} from './common.mjs';

export async function loadDomains() {
  return Promise.all(
    domains.map(async (domain) => {
      const sources = sourceFiles(domain);
      invariant(
        json(readJson(`packages/${domain}/dist/build-inputs.json`)) ===
          json(sources),
        `Stale ${domain} build; run yarn build`,
      );
      // One public entry point keeps schema object identity within one built graph.
      const module = await import(`@anarchitects/${domain}-contracts`);
      return {
        domain,
        package: readJson(`packages/${domain}/package.json`),
        schemas: module[`${domain}Schemas`],
        operations: module[`${domain}Operations`],
        profiles: module[`${domain}Profiles`],
        blockers: module[`${domain}ReleaseBlockers`] ?? [],
        sourceFiles: sources,
      };
    }),
  );
}

// Isolated, version-pinned Zod graph inspection. Never calls parsing functions or
// changes schemas. This also detects refinements the native converter omits.
export function children(schema) {
  const def = schema._zod.def;
  const result = [];
  const add = (name, value) => {
    if (value?._zod?.def?.type) result.push([name, value]);
  };
  for (const key of [
    'in',
    'out',
    'innerType',
    'element',
    'keyType',
    'valueType',
    'catchall',
    'left',
    'right',
    'rest',
  ])
    add(key, def[key]);
  for (const [key, value] of Object.entries(def.shape ?? {}))
    add(`property.${key}`, value);
  for (const key of ['options', 'items'])
    (def[key] ?? []).forEach((value, index) => add(`${key}.${index}`, value));
  if (def.type === 'lazy') add('lazy', def.getter());
  return result;
}
export function walk(schema, visit, path = [], seen = new Set()) {
  if (seen.has(schema)) return;
  seen.add(schema);
  visit(schema, path);
  for (const [key, child] of children(schema))
    walk(child, visit, [...path, key], seen);
}
export function schemaIndex(models) {
  const ids = new Map(),
    objects = new Map();
  for (const model of models)
    for (const [id, schema] of Object.entries(model.schemas).sort()) {
      invariant(
        id.startsWith(`${model.domain}.`) && /^[\w.-]+$/.test(id),
        `Invalid schema ID: ${id}`,
      );
      invariant(
        !ids.has(id) || ids.get(id) === schema,
        `Duplicate schema ID: ${id}`,
      );
      ids.set(id, schema);
      if (!objects.has(schema))
        objects.set(schema, {
          id,
          domain: model.domain,
          package: model.package.name,
        });
    }
  // Parameter schemas may be a property of a registered object. Their origin is
  // derived from that catalog, never from route names or an external registry.
  for (const [id, schema] of ids)
    walk(schema, (child, path) => {
      if (!objects.has(child))
        objects.set(child, {
          ...objects.get(schema),
          id: `${id}.node.${Buffer.from(path.join('/')).toString('hex')}`,
        });
    });
  return objects;
}

export function gaps(schema, io) {
  const result = [];
  walk(schema, (node, path) => {
    const def = node._zod.def;
    const add = (kind, value) =>
      result.push({
        kind,
        path: path.join('/'),
        implementation: digest(String(value)),
      });
    if (def.type === 'custom') add('custom-value', def.fn);
    if (def.coerce || ['default', 'prefault', 'catch'].includes(def.type))
      add(
        'implicit-normalization',
        json({ type: def.type, coerce: def.coerce ?? false }),
      );
    if (def.type === 'pipe')
      add(
        `${io}-pipeline`,
        json({ in: def.in._zod.def.type, out: def.out._zod.def.type }),
      );
    for (const check of def.checks ?? []) {
      const checkDef = check._zod.def;
      if (
        checkDef.check === 'custom' &&
        !(
          utf16Limit(node) !== null &&
          digest(String(checkDef.fn)) === utf16Check
        )
      )
        add('custom-refinement', checkDef.fn ?? check._zod.check);
      if (checkDef.check === 'overwrite') add('overwrite', checkDef.tx);
    }
  });
  return result;
}

export function fidelity(schema) {
  const result = [];
  walk(schema, (node, path) => {
    const max = utf16Limit(node);
    if (max !== null)
      result.push({ kind: 'utf16-length', path: path.join('/'), max });
  });
  return result;
}

export function projectionReview(
  schema,
  io,
  origin,
  register,
  sourceDigest,
  operationId,
  generator = generatorDigest(),
) {
  const limitations = gaps(schema, io),
    faithful = fidelity(schema);
  const review = authorizeProjection({
    origin,
    io,
    operationId,
    sourceDigest,
    limitations,
    faithful,
    register,
    generator,
  });
  return { limitations, faithful, review };
}

export function project(
  schema,
  io,
  origin,
  register,
  sourceDigest,
  reviewMode = false,
  context = {},
) {
  const assessment = projectionReview(
    schema,
    io,
    origin,
    register,
    sourceDigest,
    context.operationId,
    context.generator,
  );
  const { limitations, faithful, review } = assessment;
  const finiteAlternatives = new Map();
  walk(schema, (node) => {
    if (node._zod.def.type !== 'union') return;
    const options = node._zod.def.options;
    if (
      options.length === 2 &&
      options[0]._zod.def.type === 'number' &&
      options[1]._zod.def.type === 'custom'
    )
      finiteAlternatives.set(options[1], options[0]);
  });
  const applyWebhook = webhookFidelity(context.canonicalSchemas);
  const output = z.toJSONSchema(schema, {
    io,
    target: 'draft-2020-12',
    metadata: z.registry(),
    override: (entry) => {
      applyFidelity(entry);
      applyWebhook(entry);
    },
    unrepresentable: ({ zodSchema, message }) => {
      // Only an operation-scoped, source/generator-pinned exception permits
      // the existing finite sibling. Arbitrary custom types remain forbidden.
      invariant(
        review?.kind === 'bounded-exception' &&
          finiteAlternatives.has(zodSchema),
        `${origin.id}: ${message}`,
      );
      return z.toJSONSchema(finiteAlternatives.get(zodSchema), {
        target: 'draft-2020-12',
        metadata: z.registry(),
      });
    },
  });
  if (limitations.length)
    output['x-contract-projection'] = {
      status: 'reviewed-exception',
      reviews: [review],
      runtimeValidationRequired: true,
      warning:
        'OpenAPI-only validators and generated clients cannot substitute for canonical runtime Zod validation.',
      limitations,
    };
  return { schema: output, limitations, faithful, review };
}
