import { digest, json } from '../common.mjs';
import { sourceDigest, profileDigest, requiredEvidence } from '../profiles.mjs';

// Deliberately synthetic report data, exercising the gate's input protocol.
// These rows are not observations from an implementing host and never authorize
// release. Runtime behavior is exercised separately by frozen HTTP fixtures.
export function syntheticProfile(models) {
  const operations = models.flatMap((model) => model.operations);
  const capabilities = [
    ...new Set(operations.map((op) => op.capability)),
  ].sort();
  const variants = models
    .flatMap((model) =>
      Object.keys(model.profiles).map((name) => `${model.domain}.${name}`),
    )
    .sort();
  const profile = {
    id: 'synthetic-host',
    description: 'TEST ONLY. No deployment evidence or approval.',
    status: 'test-fixture',
    capabilities,
    variants,
    securitySchemes: {
      session: { type: 'apiKey', in: 'cookie', name: 'fixture-session' },
      device: { type: 'apiKey', in: 'header', name: 'X-Fixture-Device' },
      bearer: { type: 'http', scheme: 'bearer' },
      signature: { type: 'apiKey', in: 'header', name: 'signature' },
    },
    securityBindings: Object.fromEntries(
      [
        ...new Set(
          operations
            .filter((op) => op.security.kind === 'profile')
            .map((op) => op.security.binding),
        ),
      ].map((binding) => [
        binding,
        binding === 'newsletter.webhook-signature'
          ? [{ signature: [] }]
          : [{ session: [], device: [] }, { bearer: [] }],
      ]),
    ),
    hostBindings: {},
    contractVersions: Object.fromEntries(
      models.map((model) => [model.package.name, model.package.version]),
    ),
    contractSource: sourceDigest(models),
    host: {
      id: 'synthetic',
      repository: 'https://example.invalid/synthetic',
      revision: '0'.repeat(40),
      configurationDigest: digest('synthetic configuration'),
    },
    approval: {
      owner: 'Synthetic fixture — not an approver',
      decision: 'https://example.invalid/test-only',
      evidenceDigest: '0'.repeat(64),
    },
  };
  profile.evidence = {
    kind: 'synthetic',
    hostId: profile.host.id,
    hostRevision: profile.host.revision,
    configurationDigest: profile.host.configurationDigest,
    contractVersions: profile.contractVersions,
    contractSource: profile.contractSource,
    profileDigest: '0'.repeat(64),
    tests: operations.flatMap((op) =>
      requiredEvidence(op).map((required, index) => ({
        id: `${op.operationId}.${index}`,
        operationId: op.operationId,
        obligation: required.obligation,
        result: 'passed',
        httpStatus: required.statuses[0],
        evidence: `https://example.invalid/synthetic/${op.operationId}/${index}`,
        artifactDigest: digest(`synthetic:${op.operationId}:${index}`),
      })),
    ),
  };
  for (const model of models)
    for (const [name, variant] of Object.entries(model.profiles))
      for (const binding of variant.requiredBindings) {
        const operation = operations.find((op) =>
          variant.capabilities.includes(op.capability),
        );
        profile.hostBindings[`${model.domain}.${name}:${binding}`] = {
          description: 'Synthetic configuration reference; no secret value.',
          configurationPointer: `/synthetic/${model.domain}/${name}/${binding.replaceAll(' ', '-')}`,
          evidence: profile.evidence.tests
            .filter((item) => item.operationId === operation.operationId)
            .map((item) => item.id),
        };
      }
  return sealSynthetic(profile);
}
export function sealSynthetic(profile) {
  if (profile.evidence.kind !== 'synthetic')
    throw new Error('Fixture helper cannot prepare real deployment evidence');
  profile.evidence.profileDigest = profileDigest(profile);
  profile.approval.evidenceDigest = digest(json(profile.evidence));
  return profile;
}
