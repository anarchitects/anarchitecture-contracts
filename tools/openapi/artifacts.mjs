import { readFileSync } from 'node:fs';
import YAML from 'yaml';
import semver from 'semver';
import { digest, invariant, json, sorted } from './common.mjs';
import { generate, reviewProfile } from './generate.mjs';
import { lintDocument } from './validate.mjs';

// Artifact presentation is separate from the P07-pinned projection engine.
// It cannot change schema projections or authorize an exception.
function finish(result, manifest, document, inventory = result.inventory) {
  const jsonText = json(document);
  const yamlText = YAML.stringify(sorted(document), {
    lineWidth: 0,
    aliasDuplicateObjects: false,
  });
  const inventoryText = json(inventory);
  return {
    document: sorted(document),
    inventory,
    jsonText,
    yamlText,
    inventoryText,
    manifest: sorted({
      ...manifest,
      formatVersion: 2,
      generator: {
        ...manifest.generator,
        'tools/openapi/artifacts.mjs': digest(
          readFileSync('tools/openapi/artifacts.mjs'),
        ),
      },
      artifacts: {
        [`${manifest.profile.id}.json`]: digest(jsonText),
        [`${manifest.profile.id}.yaml`]: digest(yamlText),
        'inventory.json': digest(inventoryText),
      },
    }),
  };
}

export async function canonicalArtifacts(models, proposal) {
  // Always construct the profile here: callers cannot inject host bindings or
  // claim capabilities through a purported canonical profile.
  const diagnostic = await generate(models, {
    profile: reviewProfile(models),
    proposal,
    review: true,
  });
  const id =
    models.length === 1
      ? `${models[0].domain}-canonical`
      : 'aggregate-canonical';
  const description =
    'Implementation-independent canonical contract. Not a deployment profile. Protected operations with unresolved bindings are described in inventory.json and excluded from paths. Canonical Zod validation and normative security obligations remain required; publication claims no implementation support.';
  const profile = {
    ...diagnostic.manifest.profile,
    id,
    status: 'canonical',
    description,
  };
  const obligations = Object.fromEntries(
    diagnostic.inventory.operations.map((op) => [
      op.definition.operationId,
      op.security,
    ]),
  );
  const document = {
    ...diagnostic.document,
    info: {
      ...diagnostic.document.info,
      title: `CANONICAL — Anarchitecture ${id}`,
      description,
    },
    'x-contract-status': 'canonical',
    'x-contract-artifact-kind': 'canonical-contract',
    'x-contract-deployment-ready': false,
    'x-contract-profile': id,
    'x-contract-security-obligations': obligations,
    'x-contract-host-conformance-blockers':
      diagnostic.manifest.capabilityBlockers,
  };
  await lintDocument(document);
  const result = finish(
    diagnostic,
    {
      ...diagnostic.manifest,
      status: 'canonical',
      artifactKind: 'canonical-contract',
      profile,
      contractPublication: {
        status: 'validated',
        scope: 'canonical-source-and-artifacts',
      },
      implementationConformance: {
        status: 'unverified',
        supportedCapabilities: [],
      },
      deploymentCompliance: { status: 'unverified' },
      hostConformanceBlockers: diagnostic.manifest.capabilityBlockers,
      // Keep the legacy blocker fields for consumers; their scope is now explicit.
      blockerScope: 'implementation-and-deployment',
    },
    document,
    {
      ...diagnostic.inventory,
      status: 'canonical',
      artifactKind: 'canonical-contract',
      profile: id,
    },
  );
  // Existing diagnostic exports retain their names and nondeployable meaning.
  const artifacts = new Map([
    [`${id}.json`, result.jsonText],
    [`${id}.yaml`, result.yamlText],
    ['inventory.json', result.inventoryText],
    [`${diagnostic.manifest.profile.id}.json`, diagnostic.jsonText],
    [`${diagnostic.manifest.profile.id}.yaml`, diagnostic.yamlText],
  ]);
  result.manifest.artifacts = Object.fromEntries(
    [...artifacts].map(([name, bytes]) => [name, digest(bytes)]),
  );
  return { ...result, artifacts };
}

export async function hostArtifacts(models, options) {
  // This retains all existing approval, identity, security, evidence and D05/D08 gates.
  const result = await generate(models, options);
  if (!options.verification) {
    invariant(
      models.every(
        (model) =>
          semver.valid(model.package.version) &&
          semver.gte(model.package.version, '0.0.1'),
      ),
      'Host conformance requires distributed contract versions, not unreleased 0.0.0',
    );
  }
  const verified = !options.verification;
  const document = {
    ...result.document,
    'x-contract-artifact-kind': verified ? 'host-resolved' : 'host-test',
    'x-contract-deployment-ready': verified,
  };
  return finish(
    result,
    {
      ...result.manifest,
      artifactKind: verified ? 'host-resolved' : 'host-test',
      contractPublication: { status: 'not-applicable' },
      implementationConformance: {
        status: verified ? 'verified' : 'unverified',
        supportedCapabilities: result.manifest.supportedCapabilities,
      },
      deploymentCompliance: { status: verified ? 'verified' : 'unverified' },
    },
    document,
  );
}
