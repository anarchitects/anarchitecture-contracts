import { z } from 'zod';
import { digest, invariant } from './common.mjs';

// These identify audited implementations, not arbitrary refinements. Source and
// generator digests are additionally bound by each operation's review record.
export const utf16Check =
  'db237a03f3eacd803096e0ae3e950ad26a74db0e8148e0d53b084cfe48e0cec7';
export function utf16Limit(schema) {
  const def = schema._zod.def;
  if (
    def.type !== 'string' ||
    !def.checks?.some(
      (check) =>
        check._zod.def.check === 'custom' &&
        digest(String(check._zod.def.fn)) === utf16Check,
    )
  )
    return null;
  const limit = def.checks.find(
    (check) => check._zod.def.check === 'max_length',
  )?._zod.def.maximum;
  invariant(
    Number.isInteger(limit) && limit >= 0 && limit <= 2048,
    'Unreviewed UTF-16 bound',
  );
  return limit;
}

export function utf16Constraints(max) {
  // UTF-16 units = Unicode code points + supplementary code points. If there
  // are at least k supplementary points, code-point length must be <= max-k.
  // More than floor(max/2) supplementary points cannot fit. BMP characters,
  // including lone surrogates, consume exactly one unit. No parser is changed.
  const supplementary = '[^\\u0000-\\uffff]';
  const prefix = '[\\u0000-\\uffff]*';
  return Array.from(
    { length: max === 0 ? 0 : Math.floor(max / 2) + 1 },
    (_, index) => {
      const k = index + 1;
      return {
        if: { pattern: `^(?:${prefix}${supplementary}){${k}}` },
        then: { maxLength: max - k },
      };
    },
  );
}

export function applyFidelity({ zodSchema, jsonSchema }) {
  const max = utf16Limit(zodSchema);
  if (max !== null) {
    jsonSchema.allOf = [...(jsonSchema.allOf ?? []), ...utf16Constraints(max)];
    jsonSchema['x-contract-fidelity'] = {
      constraint: 'utf16-length',
      max,
      proof: 'docs/openapi-projection-proposal.md#faithful-utf-16-length',
    };
  }
  const def = zodSchema._zod.def;
  if (
    def.type === 'pipe' &&
    def.out._zod.def.type === 'string' &&
    isStringCoercion(zodSchema)
  ) {
    const output = nativeOutput(def.out);
    delete output.$schema;
    const rejected = [null, false, true].filter(
      (value) => !zodSchema.safeParse(value).success,
    );
    jsonSchema.allOf = [
      ...(jsonSchema.allOf ?? []),
      { if: { type: 'string' }, then: output },
      {
        if: {
          type: 'array',
          minItems: 1,
          maxItems: 1,
          prefixItems: [{ type: 'string' }],
        },
        then: { prefixItems: [output] },
      },
      ...(rejected.length
        ? [
            {
              not: { enum: [...rejected, ...rejected.map((value) => [value])] },
            },
          ]
        : []),
    ];
    jsonSchema['x-contract-fidelity'] = {
      constraint: 'string-coercion-preimage',
      exactBranches: ['string', 'singleton-string', 'boolean', 'null'],
      remaining:
        'Numeric stringification remains a scoped projection exception.',
    };
  }
}

function isStringCoercion(schema) {
  const def = schema._zod.def;
  if (def.type !== 'pipe') return false;
  const inner = def.in._zod.def;
  if (inner.type !== 'pipe') return false;
  if (inner.out._zod.def.type === 'transform')
    return (
      digest(String(inner.out._zod.def.transform)) ===
      '432424bcd227752dfedcde7b8724a545f647a83df139ae292a9af979db2b297e'
    );
  return inner.out._zod.def.type === 'string' && isStringCoercion(def.in);
}

export function nativeOutput(schema) {
  return z.toJSONSchema(schema, {
    io: 'output',
    target: 'draft-2020-12',
    metadata: z.registry(),
    override: applyFidelity,
    unrepresentable: 'throw',
  });
}

// These are converter rules for the source-pinned Newsletter refinement, using
// the canonical leaf schemas. Cross-field equality of arbitrary event aliases
// and JavaScript Date.parse remain explicit exceptions.
export function webhookFidelity(catalog) {
  const event = catalog?.['newsletter.NewsletterWebhookEvent'];
  if (!event) return () => {};
  const id = nativeOutput(catalog['newsletter.NewsletterWebhookIdentifier']);
  const email = nativeOutput(catalog['newsletter.NewsletterEmail']);
  const timestamp = nativeOutput(
    catalog['newsletter.NewsletterWebhookTimestamp'],
  );
  for (const value of [id, email, timestamp]) delete value.$schema;
  const fallback = (fields) => {
    const [field, ...remaining] = fields;
    const present = { required: [field], properties: { [field]: timestamp } };
    return remaining.length
      ? {
          if: {
            required: [field],
            properties: { [field]: { not: { type: 'null' } } },
          },
          then: present,
          else: fallback(remaining),
        }
      : present;
  };
  return ({ zodSchema, jsonSchema }) => {
    const def = zodSchema._zod.def;
    if (
      def.type !== 'object' ||
      !def.checks?.includes(event._zod.def.checks[0]) ||
      def.shape.event !== event.shape.event ||
      def.shape.type !== event.shape.type
    )
      return;
    const clauses = [
      {
        anyOf: [
          { required: ['event'], properties: { event: { pattern: '\\S' } } },
          {
            not: { required: ['event'] },
            required: ['type'],
            properties: { type: { pattern: '\\S' } },
          },
        ],
      },
    ];
    for (const name of ['subscriber.unsubscribed', 'subscriber.deleted']) {
      const fields = name.endsWith('unsubscribed')
        ? ['unsubscribed_at', 'updated_at']
        : ['deleted_at', 'forget_at', 'updated_at'];
      const data = {
        type: 'object',
        required: ['id', 'email'],
        properties: { id, email },
        allOf: [fallback(fields)],
      };
      clauses.push({
        if: {
          anyOf: [
            { required: ['event'], properties: { event: { const: name } } },
            {
              not: { required: ['event'] },
              required: ['type'],
              properties: { type: { const: name } },
            },
          ],
        },
        then: {
          if: { required: ['subscriber'] },
          then: { properties: { subscriber: data } },
          else: data,
        },
      });
    }
    if (def.checks.length > event._zod.def.checks.length)
      clauses.push({ not: { required: ['events'] } });
    jsonSchema.allOf = [...(jsonSchema.allOf ?? []), ...clauses];
    jsonSchema['x-contract-fidelity'] = {
      constraint: 'webhook-conditional-structure',
      remaining:
        'Arbitrary event/type equality and exact JavaScript timestamp parseability require canonical validation.',
    };
  };
}
