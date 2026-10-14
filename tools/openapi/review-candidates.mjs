// Produce review candidates, never approvals. No generation command updates the
// accepted register automatically after a source or generator change.
import { loadDomains, schemaIndex, gaps, fidelity } from './model.mjs';
import { digest, json, readJson, invariant } from './common.mjs';
import { configureAuthModels } from './auth-configuration.mjs';
import { decision, generatorDigest } from './projection-review.mjs';

export function candidates(models) {
  const index = schemaIndex(models),
    generator = generatorDigest(),
    entries = new Map();
  for (const model of models)
    for (const op of model.operations) {
      const add = (schema, io) => {
        const origin = index.get(schema),
          limitations = gaps(schema, io),
          faithful = fidelity(schema);
        if (!limitations.length && !faithful.length) return;
        const id = `${op.operationId}.${origin.id}.${io}`;
        entries.set(id, {
          id,
          domain: origin.domain,
          operationId: op.operationId,
          component: origin.id,
          io,
          kind: limitations.length
            ? 'bounded-exception'
            : 'faithful-conversion',
          status: 'draft',
          owner: 'Contracts architecture and affected domain maintainers',
          decision,
          sourceDigest: digest(json(model.sourceFiles)),
          generatorDigest: generator,
          limitations,
          faithful,
          rationale: limitations.length
            ? 'Retain the canonical accepted wire language and parsed values. Exact JavaScript overflow, normalization and cross-field/runtime refinements are not completely expressible in portable OpenAPI 3.1. Representable constraints are retained; the remaining graph locations are disclosed. Canonical Zod validation is mandatory.'
            : 'Exact UTF-16 unit bounds derived from canonical Zod checks without changing wire acceptance.',
          evidence: [
            'tools/openapi/openapi.test.mjs',
            'tools/openapi/fidelity.test.mjs',
            'tools/openapi/profiles.test.mjs',
            'tools/contract-authoring/compatibility.test.mjs',
            'tools/contract-authoring/forms-newsletter.test.mjs',
            'docs/openapi-projection-proposal.md',
            ...(model.domain === 'auth'
              ? [
                  'tools/contract-authoring/auth-profiles.test.mjs',
                  'tools/openapi/auth-configuration.test.mjs',
                ]
              : []),
          ],
        });
      };
      const body = (value, io) => {
        if (value.kind === 'json')
          Object.values(value.content).forEach((schema) => add(schema, io));
        if (value.kind === 'raw') add(value.parsedSchema, io);
      };
      op.parameters.forEach(({ schema }) => add(schema, 'input'));
      body(op.requestBody, 'input');
      Object.values(op.responses).forEach((response) => {
        body(response.body, 'output');
        response.headers.forEach(({ schema }) => add(schema, 'output'));
      });
    }
  return {
    id: 'P07',
    status: 'draft',
    decision,
    entries: [...entries.values()].sort((a, b) =>
      a.id.localeCompare(b.id, 'en'),
    ),
  };
}
if (process.argv[1]?.endsWith('/review-candidates.mjs')) {
  invariant(
    process.argv.length <= 3,
    'Usage: review-candidates.mjs [auth-config.json]',
  );
  const config = process.argv[2] ? readJson(process.argv[2]) : undefined;
  console.log(
    json(candidates(configureAuthModels(await loadDomains(), config))),
  );
}
