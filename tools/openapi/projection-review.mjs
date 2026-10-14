import { readFileSync } from 'node:fs';
import { digest, json, invariant } from './common.mjs';

export const decision =
  'https://github.com/anarchitects/anarchitecture-contracts/issues/7#issuecomment-6146764328';
export function generatorFiles() {
  return Object.fromEntries(
    [
      'common.mjs',
      'model.mjs',
      'generate.mjs',
      'validate.mjs',
      'fidelity.mjs',
      'projection-review.mjs',
      'profiles.mjs',
      'auth-configuration.mjs',
    ].map((file) => [
      `tools/openapi/${file}`,
      digest(readFileSync(`tools/openapi/${file}`)),
    ]),
  );
}
export const generatorDigest = () => digest(json(generatorFiles()));

export function authorizeProjection({
  origin,
  io,
  operationId,
  sourceDigest,
  limitations,
  faithful,
  register,
  generator,
}) {
  if (!limitations.length && !faithful.length) return null;
  invariant(
    operationId,
    `${origin.id}: operation-scoped projection review is required`,
  );
  invariant(
    register?.status === 'reviewed-register',
    'A reviewed projection register is required',
  );
  const entries = register.entries.filter(
    (item) =>
      item.domain === origin.domain &&
      item.operationId === operationId &&
      item.component === origin.id &&
      item.io === io,
  );
  invariant(
    entries.length === 1,
    `${operationId}/${origin.id}: no scoped projection review or ambiguous duplicate`,
  );
  const [entry] = entries;
  invariant(
    entry.status === 'reviewed' &&
      entry.owner &&
      entry.decision === decision &&
      entry.rationale &&
      entry.evidence?.length,
    `${entry.id}: incomplete review decision`,
  );
  invariant(
    entry.sourceDigest === sourceDigest,
    `${entry.id}: unreviewed source bytes`,
  );
  invariant(
    entry.generatorDigest === generator,
    `${entry.id}: unreviewed generator bytes`,
  );
  invariant(
    json(entry.limitations) === json(limitations) &&
      json(entry.faithful) === json(faithful),
    `${entry.id}: unreviewed constraint/function changes`,
  );
  invariant(
    entry.kind ===
      (limitations.length ? 'bounded-exception' : 'faithful-conversion'),
    `${entry.id}: incorrect review kind`,
  );
  return {
    id: entry.id,
    kind: entry.kind,
    owner: entry.owner,
    decision: entry.decision,
    sourceDigest,
    generatorDigest: generator,
    rationale: entry.rationale,
    evidence: entry.evidence,
  };
}
