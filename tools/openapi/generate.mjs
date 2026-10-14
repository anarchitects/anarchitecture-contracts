import { readFileSync } from 'node:fs';
import { z } from 'zod';
import YAML from 'yaml';
import { digest, json, sorted, invariant } from './common.mjs';
import { project, projectionReview, schemaIndex } from './model.mjs';
import {
  validateRegistry,
  validateRequirements,
  lintDocument,
} from './validate.mjs';

import { generatorFiles, generatorDigest } from './projection-review.mjs';
import { validateResolvedProfile, capabilityBlockers } from './profiles.mjs';
import { configureAuthModels } from './auth-configuration.mjs';

export function reviewProfile(models) {
  return {
    id: models.length === 1 ? `${models[0].domain}-review` : 'aggregate-review',
    status: 'review-only',
    capabilities: [
      ...new Set(
        models.flatMap((model) => model.operations.map((op) => op.capability)),
      ),
    ].sort(),
    variants: models
      .flatMap((model) =>
        Object.keys(model.profiles).map((name) => `${model.domain}.${name}`),
      )
      .sort(),
    securityBindings: {},
    securitySchemes: {},
    hostBindings: {},
    description:
      'Diagnostic projection for review. Protected operations remain in the inventory and are excluded from paths until security bindings are resolved. No deployment or compatibility claim.',
  };
}

export async function generate(
  models,
  { profile, proposal, review = false, verification = false },
) {
  models = configureAuthModels(models, profile?.authConfig);
  models = models.toSorted((a, b) => a.domain.localeCompare(b.domain, 'en'));
  invariant(
    z.core.version.major === 4 &&
      z.core.version.minor === 5 &&
      z.core.version.patch === 0,
    'Re-audit graph/conversion behavior before updating Zod 4.5.0',
  );
  invariant(
    profile && /^[\w.-]+$/.test(profile.id),
    'A named profile is required',
  );
  invariant(
    Array.isArray(profile.capabilities) &&
      new Set(profile.capabilities).size === profile.capabilities.length,
    'Invalid capability list',
  );
  const allCapabilities = new Set(
    models.flatMap((model) => model.operations.map((op) => op.capability)),
  );
  const enabledCapabilities = new Set([
    ...profile.capabilities,
    ...models.flatMap((model) =>
      model.operations
        .filter((op) => op.availability.kind === 'always')
        .map((op) => op.capability),
    ),
  ]);
  invariant(
    profile.capabilities.every((capability) => allCapabilities.has(capability)),
    'Unknown profile capability',
  );
  invariant(
    profile.securityBindings && profile.securitySchemes && profile.hostBindings,
    'Missing profile bindings',
  );
  const reviewOnly = review || verification;
  const status = review
    ? 'review-only'
    : verification
      ? 'test-only'
      : 'resolved';
  if (!review)
    invariant(
      profile.status === (verification ? 'test-fixture' : 'approved') &&
        profile.approval?.decision &&
        profile.approval?.owner,
      'Release requires an approved profile with review evidence',
    );
  const index = schemaIndex(models);
  validateRegistry(models, index);
  const sourceDigests = Object.fromEntries(
    models.map((model) => [model.domain, digest(json(model.sourceFiles))]),
  );
  const generator = generatorDigest();
  let operationId;
  const projectionReviews = {};
  const components = {},
    origins = {},
    projections = {};
  function reference(schema, io) {
    const origin = index.get(schema);
    invariant(origin, 'Unregistered schema reference');
    const name = `${origin.id}.${io === 'input' ? 'Input' : 'Output'}`;
    const assessment = projectionReview(
      schema,
      io,
      origin,
      proposal,
      sourceDigests[origin.domain],
      operationId,
      generator,
    );
    if (assessment.review)
      projectionReviews[assessment.review.id] = assessment.review;
    if (!Object.hasOwn(components, name)) {
      const result = project(
        schema,
        io,
        origin,
        proposal,
        sourceDigests[origin.domain],
        review,
        {
          operationId,
          generator,
          canonicalSchemas: models.find(
            (model) => model.domain === origin.domain,
          ).schemas,
        },
      );
      const component = structuredClone(result.schema);
      delete component.$schema;
      // Native recursive JSON schemas use local #/$defs refs. Relocate the
      // entire resource when embedding it under an OpenAPI component.
      const relocate = (value) => {
        if (!value || typeof value !== 'object') return;
        if (value.$ref?.startsWith('#'))
          value.$ref = `#/components/schemas/${name}${value.$ref.slice(1)}`;
        Object.values(value).forEach(relocate);
      };
      relocate(component);
      components[name] = component;
      origins[name] = { ...origin, io };
      if (result.limitations.length) projections[name] = result.limitations;
    }
    const annotation = components[name]['x-contract-projection'];
    if (
      annotation &&
      !annotation.reviews.some((entry) => entry.id === assessment.review.id)
    )
      annotation.reviews.push(assessment.review);
    return { $ref: `#/components/schemas/${name}` };
  }
  function content(body, io) {
    if (body.kind === 'none') return {};
    if (body.kind === 'json')
      return {
        content: Object.fromEntries(
          Object.entries(body.content).map(([media, schema]) => [
            media,
            { schema: reference(schema, io) },
          ]),
        ),
      };
    return {
      content: {
        [body.mediaType]: { schema: reference(body.parsedSchema, io) },
      },
      'x-contract-raw-body': {
        preserveExactBytes: true,
        semantics: body.semantics,
        validationOrder: 'Verify the exact bytes before parsing this schema.',
      },
    };
  }
  const paths = {},
    inventory = [],
    excluded = [],
    unresolved = [],
    releaseBlockers = [];
  for (const model of models) {
    for (const [name, requirement] of Object.entries(model.profiles)) {
      if (!review && !profile.variants?.includes(`${model.domain}.${name}`))
        continue;
      if (
        !requirement.capabilities.some((capability) =>
          enabledCapabilities.has(capability),
        )
      )
        continue;
      for (const binding of requirement.requiredBindings) {
        const key = `${model.domain}.${name}:${binding}`;
        const value = profile.hostBindings[key];
        if (!value?.description || !value?.evidence) unresolved.push(key);
      }
    }
    releaseBlockers.push(
      ...model.blockers.filter((blocker) =>
        enabledCapabilities.has(blocker.capability),
      ),
    );
  }
  if (!review) {
    invariant(
      !unresolved.length,
      `Unresolved host bindings: ${unresolved.join(', ')}`,
    );
    invariant(
      !releaseBlockers.length,
      `Blocked capabilities: ${releaseBlockers.map((blocker) => blocker.id).join(', ')}`,
    );
  }
  const enabledOperations = models
    .flatMap((model) => model.operations)
    .filter((op) => enabledCapabilities.has(op.capability));
  const provenance = review
    ? null
    : validateResolvedProfile(profile, models, enabledOperations, {
        verification,
      });
  for (const op of models
    .flatMap((model) => model.operations)
    .sort((a, b) => a.operationId.localeCompare(b.operationId, 'en'))) {
    const enabled =
      op.availability.kind === 'always' ||
      profile.capabilities.includes(op.capability);
    if (!enabled) {
      excluded.push({
        operationId: op.operationId,
        reason: 'disabled-capability',
      });
      continue;
    }
    operationId = op.operationId;
    let security;
    if (op.security.kind === 'public') security = [];
    else if (op.security.kind === 'required')
      security = op.security.alternatives;
    else security = profile.securityBindings[op.security.binding];
    if (security !== undefined && op.security.kind !== 'public')
      validateRequirements(security, profile.securitySchemes);
    if (!review)
      invariant(
        security !== undefined,
        `Unresolved security: ${op.operationId}/${op.security.binding}`,
      );
    const parameters = op.parameters.map(
      ({ schema, serialization, ...parameter }) => ({
        ...parameter,
        ...serialization,
        schema: reference(schema, 'input'),
      }),
    );
    const responses = Object.fromEntries(
      Object.entries(op.responses).map(([status, response]) => [
        status,
        {
          description: response.description,
          ...content(response.body, 'output'),
          headers: Object.fromEntries(
            response.headers.map((header) => [
              header.name,
              {
                description: header.presence,
                schema: reference(header.schema, 'output'),
                'x-contract-cardinality': header.cardinality,
                'x-contract-presence': header.presence,
              },
            ]),
          ),
          'x-contract-outcome': response.outcome,
          'x-contract-semantics': response.semantics,
        },
      ]),
    );
    const value = {
      operationId: op.operationId,
      tags: op.tags,
      summary: op.summary,
      description: op.description,
      deprecated: op.deprecated,
      parameters,
      responses,
      ...(op.requestBody.kind === 'none'
        ? {}
        : {
            requestBody: {
              required: op.requestBody.required,
              ...content(op.requestBody, 'input'),
            },
          }),
      'x-contract-domain': op.domain,
      'x-contract-capability': op.capability,
      'x-contract-semantics': op.semantics,
      'x-contract-compatibility': op.compatibility,
    };
    inventory.push({
      method: op.method,
      path: op.path,
      security: op.security,
      availability: op.availability,
      definition: value,
    });
    if (security === undefined) {
      excluded.push({
        operationId: op.operationId,
        reason: 'unresolved-security',
        binding: op.security.binding,
      });
      continue;
    }
    paths[op.path] ??= {};
    paths[op.path][op.method.toLowerCase()] = { ...value, security };
  }
  const versions = Object.fromEntries(
    models.map((model) => [model.package.name, model.package.version]),
  );
  const document = sorted({
    openapi: '3.1.1',
    jsonSchemaDialect: 'https://json-schema.org/draft/2020-12/schema',
    info: {
      title: `${reviewOnly ? `${status.toUpperCase()} — ` : ''}Anarchitecture ${profile.id}`,
      // Aggregate identity is a content digest, never a shared domain release.
      version:
        models.length === 1
          ? models[0].package.version
          : `sha256:${digest(json({ versions, sourceDigests, profile }))}`,
      description: profile.description,
    },
    tags: [...new Set(inventory.flatMap((entry) => entry.definition.tags))]
      .sort()
      .map((name) => ({ name })),
    paths,
    components: {
      schemas: components,
      securitySchemes: profile.securitySchemes,
    },
    'x-contract-status': status,
    'x-contract-profile': profile.id,
    ...(profile.authConfig
      ? { 'x-contract-auth-config': profile.authConfig }
      : {}),
    'x-contract-versions': versions,
    'x-contract-excluded-operations': excluded,
  });
  await lintDocument(document);
  const jsonText = json(document),
    yamlText = YAML.stringify(document, {
      lineWidth: 0,
      aliasDuplicateObjects: false,
    });
  const inventoryText = json({
    status: 'diagnostic-only',
    profile: profile.id,
    operations: inventory,
    schemas: components,
  });
  const rootPackage = JSON.parse(readFileSync('package.json', 'utf8'));
  const manifest = {
    formatVersion: 1,
    status,
    profile,
    packages: versions,
    dependencies: Object.fromEntries(
      models.map((model) => [model.package.name, model.package.dependencies]),
    ),
    tools: Object.fromEntries(
      ['zod', 'yaml', '@apidevtools/swagger-parser'].map((name) => [
        name,
        rootPackage.devDependencies[name],
      ]),
    ),
    generator: generatorFiles(),
    provenance,
    projectionReviews,
    capabilityBlockers: capabilityBlockers(models)
      .filter(
        (blocker) => reviewOnly || !enabledCapabilities.has(blocker.capability),
      )
      .concat(models.flatMap((model) => model.blockers)),
    source: {
      revision: `sha256:${digest(json(models.map((model) => ({ domain: model.domain, files: model.sourceFiles }))))}`,
      files: Object.assign({}, ...models.map((model) => model.sourceFiles)),
    },
    schemaOrigins: origins,
    projections,
    projectionProposal: Object.keys(projectionReviews).length
      ? {
          id: proposal.id,
          status: proposal.status,
          digest: digest(json(proposal)),
        }
      : null,
    unresolvedHostBindings: [...new Set(unresolved)].sort(),
    releaseBlockers,
    excludedOperations: excluded,
    supportedCapabilities: reviewOnly ? [] : [...enabledCapabilities].sort(),
    operationCount: inventory.length,
    documentedOperationCount: Object.values(paths).reduce(
      (count, item) => count + Object.keys(item).length,
      0,
    ),
    artifacts: {
      [`${profile.id}.json`]: digest(jsonText),
      [`${profile.id}.yaml`]: digest(yamlText),
      'inventory.json': digest(inventoryText),
    },
  };
  return {
    document,
    manifest: sorted(manifest),
    inventory: JSON.parse(inventoryText),
    jsonText,
    yamlText,
    inventoryText,
  };
}
