import { z } from 'zod';
import { AuthContractConfigSchema } from '@anarchitects/auth-contracts';
import { digest, json, invariant } from './common.mjs';
import { validateRequirements } from './validate.mjs';

const hash = z.string().regex(/^[a-f0-9]{64}$/);
const revision = z.string().regex(/^[a-f0-9]{40}$/);
const text = z.string().min(1);
const versions = z.record(
  text,
  z.string().regex(/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/),
);
const approval = z.strictObject({
  owner: text,
  decision: z.url(),
  evidenceDigest: hash,
});
const scheme = z.union([
  z.strictObject({
    type: z.literal('apiKey'),
    in: z.enum(['cookie', 'header']),
    name: text,
    description: text.optional(),
  }),
  z.strictObject({
    type: z.literal('http'),
    scheme: z.literal('bearer'),
    bearerFormat: text.optional(),
    description: text.optional(),
  }),
]);
export const ResolvedProfileSchema = z.strictObject({
  authConfig: AuthContractConfigSchema.optional(),
  id: z.string().regex(/^[\w.-]+$/),
  description: text,
  status: z.enum(['approved', 'test-fixture']),
  capabilities: z.array(text).min(1),
  variants: z.array(text).min(1),
  securityBindings: z.record(
    text,
    z.array(z.record(text, z.array(text))).min(1),
  ),
  securitySchemes: z.record(text, scheme),
  hostBindings: z.record(
    text,
    z.strictObject({
      description: text,
      configurationPointer: z.string().regex(/^\//),
      evidence: z.array(text).min(1),
    }),
  ),
  contractVersions: versions,
  contractSource: hash,
  host: z.strictObject({
    id: text,
    repository: z.url(),
    revision,
    configurationDigest: hash,
  }),
  approval,
  evidence: z.strictObject({
    kind: z.enum(['host-runtime', 'synthetic']),
    hostId: text,
    hostRevision: revision,
    configurationDigest: hash,
    contractVersions: versions,
    contractSource: hash,
    profileDigest: hash,
    tests: z
      .array(
        z.strictObject({
          id: text,
          operationId: text,
          obligation: text,
          result: z.enum(['passed', 'failed', 'skipped']),
          httpStatus: z.number().int().min(100).max(599),
          evidence: z.url(),
          artifactDigest: hash,
        }),
      )
      .min(1),
  }),
});

export function sourceDigest(models) {
  return digest(
    json(Object.assign({}, ...models.map((model) => model.sourceFiles))),
  );
}
export function profileDigest(profile) {
  const { evidence, approval: ignored, status, ...bindings } = profile;
  return digest(json(bindings));
}
export function requiredEvidence(op) {
  const requirements = [
    {
      obligation: 'positive',
      statuses: Object.entries(op.responses)
        .filter(([, response]) => response.outcome === 'success')
        .map(([status]) => Number(status)),
    },
  ];
  for (const status of Object.keys(op.responses)
    .map(Number)
    .filter((status) => status >= 400))
    requirements.push({ obligation: `outcome:${status}`, statuses: [status] });
  if (op.responses['400'])
    requirements.push({ obligation: 'invalid-input', statuses: [400] });
  if (op.security.kind !== 'public') {
    requirements.push({ obligation: 'unauthenticated', statuses: [401] });
    if (op.responses['403'])
      requirements.push(
        { obligation: 'forbidden', statuses: [403] },
        {
          obligation: 'resource-ownership',
          statuses: [403, 404].filter((status) => op.responses[status]),
        },
      );
  }
  for (const fixture of op.compatibility.fixtures)
    requirements.push({
      obligation: `fixture:${fixture}`,
      statuses: Object.keys(op.responses).map(Number),
    });
  for (const semantic of op.semantics)
    requirements.push({
      obligation: semantic.id,
      statuses: Object.keys(op.responses).map(Number),
    });
  for (const [status, response] of Object.entries(op.responses))
    for (const header of response.headers)
      requirements.push({
        obligation: `header:${status}:${header.name}:${header.cardinality}`,
        statuses: [Number(status)],
      });
  if (op.requestBody.kind === 'raw')
    requirements.push(
      { obligation: 'signature-mutated-bytes', statuses: [401] },
      { obligation: 'signature-missing', statuses: [401] },
      { obligation: 'raw-body-limit', statuses: [413] },
    );
  return requirements;
}

export function validateResolvedProfile(
  profile,
  models,
  operations,
  { verification = false } = {},
) {
  ResolvedProfileSchema.parse(profile); // Reject undeclared fields; credentials must stay out of descriptions too.
  invariant(
    profile.status === (verification ? 'test-fixture' : 'approved'),
    verification
      ? 'Verification requires an explicit test-fixture profile'
      : 'Release requires an approved profile',
  );
  invariant(
    profile.evidence.kind === (verification ? 'synthetic' : 'host-runtime'),
    'Synthetic evidence cannot authorize release',
  );
  const variants = Object.fromEntries(
    models.flatMap((model) =>
      Object.entries(model.profiles).map(([name, value]) => [
        `${model.domain}.${name}`,
        value,
      ]),
    ),
  );
  const enabled = new Set(operations.map((op) => op.capability));
  invariant(
    new Set(profile.variants).size === profile.variants.length &&
      profile.variants.every(
        (name) =>
          variants[name] &&
          variants[name].capabilities.every((capability) =>
            enabled.has(capability),
          ),
      ),
    'Unknown, duplicate or incomplete profile variant',
  );
  invariant(
    [...enabled].every((capability) =>
      profile.variants.some((name) =>
        variants[name].capabilities.includes(capability),
      ),
    ),
    'Unresolved capability variant',
  );
  const requiredBindings = new Map(
    profile.variants.flatMap((name) =>
      variants[name].requiredBindings.map((binding) => [
        `${name}:${binding}`,
        variants[name],
      ]),
    ),
  );
  invariant(
    Object.keys(profile.hostBindings).length === requiredBindings.size &&
      [...requiredBindings.keys()].every((name) => profile.hostBindings[name]),
    'Host bindings must exactly resolve the selected variants',
  );
  const expectedVersions = Object.fromEntries(
    models.map((model) => [model.package.name, model.package.version]),
  );
  invariant(
    json(profile.contractVersions) === json(expectedVersions) &&
      json(profile.evidence.contractVersions) === json(expectedVersions),
    'Host evidence contract versions do not match',
  );
  invariant(
    profile.contractSource === sourceDigest(models) &&
      profile.evidence.contractSource === profile.contractSource,
    'Host evidence contract source does not match',
  );
  invariant(
    profile.evidence.hostId === profile.host.id &&
      profile.evidence.hostRevision === profile.host.revision &&
      profile.evidence.configurationDigest === profile.host.configurationDigest,
    'Host evidence configuration/revision does not match',
  );
  invariant(
    profile.evidence.profileDigest === profileDigest(profile),
    'Host evidence does not cover these profile bindings',
  );
  invariant(
    profile.approval.evidenceDigest === digest(json(profile.evidence)),
    'Approval does not cover these evidence bytes',
  );
  const caseIds = new Set();
  for (const item of profile.evidence.tests) {
    invariant(!caseIds.has(item.id), `Duplicate evidence case: ${item.id}`);
    caseIds.add(item.id);
    invariant(
      item.result === 'passed',
      `Non-passing host evidence: ${item.id}`,
    );
    invariant(
      operations.some((op) => op.operationId === item.operationId),
      `Evidence for a disabled/unknown operation: ${item.operationId}`,
    );
  }
  for (const [name, binding] of Object.entries(profile.hostBindings))
    invariant(
      binding.evidence.every(
        (id) =>
          caseIds.has(id) &&
          profile.evidence.tests.some(
            (item) =>
              item.id === id &&
              operations.some(
                (op) =>
                  op.operationId === item.operationId &&
                  requiredBindings
                    .get(name)
                    ?.capabilities.includes(op.capability),
              ),
          ),
      ),
      `Unresolved evidence for host binding: ${name}`,
    );
  for (const op of operations) {
    if (op.security.kind !== 'public') {
      const alternatives =
        op.security.kind === 'required'
          ? op.security.alternatives
          : profile.securityBindings[op.security.binding];
      validateRequirements(alternatives, profile.securitySchemes);
      if (op.requestBody.kind === 'raw') {
        const signature = op.parameters.find(
          (parameter) => parameter.in === 'header' && parameter.required,
        );
        invariant(
          signature &&
            alternatives.every((alternative) =>
              Object.keys(alternative).some((name) => {
                const transport = profile.securitySchemes[name];
                return (
                  transport.type === 'apiKey' &&
                  transport.in === 'header' &&
                  transport.name.toLowerCase() === signature.name.toLowerCase()
                );
              }),
            ),
          'Every webhook alternative must require its authored signature header',
        );
      }
    }
    for (const required of requiredEvidence(op))
      invariant(
        profile.evidence.tests.some(
          (item) =>
            item.operationId === op.operationId &&
            item.obligation === required.obligation &&
            required.statuses.includes(item.httpStatus),
        ),
        `${op.operationId}: missing verified ${required.obligation} evidence`,
      );
  }
  return {
    kind: profile.evidence.kind,
    digest: digest(json(profile.evidence)),
    host: profile.host,
    approval: profile.approval,
  };
}

export function capabilityBlockers(models) {
  return models.flatMap((model) =>
    [...new Set(model.operations.map((op) => op.capability))]
      .sort()
      .map((capability) => ({
        capability,
        status: 'host-evidence-required',
        owner: 'Implementing host maintainers',
        issues: [
          `https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/${['auth', 'identity'].includes(model.domain) ? 488 : 489}`,
          'https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/490',
          'https://github.com/anarchitects/anarchitecture-bricks-ddd/issues/23',
        ],
        requirement:
          'Approved exact-version host configuration and positive/negative/security HTTP evidence. Contracts #8 packages verified results; it does not create host evidence.',
      })),
  );
}
