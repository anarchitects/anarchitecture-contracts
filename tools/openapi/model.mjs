import { z } from 'zod';
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
      if (checkDef.check === 'custom')
        add('custom-refinement', checkDef.fn ?? check._zod.check);
      if (checkDef.check === 'overwrite') add('overwrite', checkDef.tx);
    }
  });
  return result;
}

export function project(
  schema,
  io,
  origin,
  proposal,
  sourceDigest,
  review = false,
) {
  const limitations = gaps(schema, io);
  if (limitations.length) {
    invariant(
      review,
      `${origin.id}: unsupported schema projection (${limitations.map((gap) => gap.kind).join(', ')})`,
    );
    invariant(
      proposal.status === 'proposed' &&
        proposal.sourceDigests[origin.domain] === sourceDigest,
      `${origin.id}: projection proposal does not cover these source bytes`,
    );
    for (const gap of limitations)
      invariant(
        proposal.rules.some(
          (rule) =>
            rule.domain === origin.domain &&
            rule.kind === gap.kind &&
            rule.implementation === gap.implementation,
        ),
        `${origin.id}: unreviewed projection rule ${gap.kind}/${gap.implementation}`,
      );
  }
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
  const output = z.toJSONSchema(schema, {
    io,
    target: 'draft-2020-12',
    metadata: z.registry(),
    unrepresentable: ({ zodSchema, message }) => {
      // The draft exception permits exactly the pinned overflow branch's finite
      // sibling projection. No {} fallback, arbitrary custom type or rewrite.
      invariant(
        review && finiteAlternatives.has(zodSchema),
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
      proposal: proposal.id,
      status: 'proposed',
      limitations,
    };
  return { schema: output, limitations };
}
