import type { z } from 'zod';
import type {
  ResponseDefinition,
  SemanticRequirement,
} from '../../../../tools/contract-authoring/operation-definition.js';
import {
  BadRequestErrorSchema,
  TooManyRequestsErrorSchema,
  ServiceUnavailableErrorSchema,
  NotFoundErrorSchema,
  RetryAfterHeaderSchema,
  CacheControlHeaderSchema,
  ReferrerPolicyHeaderSchema,
} from '../schemas/index.js';
export const json = <S extends z.ZodType>(schema: S) =>
  ({
    kind: 'json',
    required: true,
    content: { 'application/json': schema },
  }) as const;
export const response = <S extends z.ZodType>(
  schema: S,
  outcome: 'success' | 'error',
  description: string,
) =>
  ({
    outcome,
    description,
    body: json(schema),
    headers: [],
    semantics: [],
  }) as const satisfies ResponseDefinition<z.ZodType>;
export const badRequest = response(
  BadRequestErrorSchema,
  'error',
  'Invalid newsletter request. Preserve generic messages and the applicable malformed-JSON boundary.',
);
export const unavailable = response(
  ServiceUnavailableErrorSchema,
  'error',
  'Sanitized processing failure; do not expose persistence/provider details.',
);
export const disabled = response(
  NotFoundErrorSchema,
  'error',
  'The capability is disabled; no action or evidence write occurs.',
);
export const rateLimited = {
  ...response(
    TooManyRequestsErrorSchema,
    'error',
    'Too many newsletter requests.',
  ),
  headers: [
    {
      name: 'retry-after',
      schema: RetryAfterHeaderSchema,
      cardinality: 'single',
      presence:
        'Required when the configured limiter denies a request; seconds are rounded up from retryAfterMs.',
    },
  ],
} as const;
export const nativeHeaders = [
  {
    name: 'cache-control',
    schema: CacheControlHeaderSchema,
    cardinality: 'single',
    presence:
      'Required on outcomes reached through the enabled native action controller, including validation/rate/service errors; not promised for pre-controller malformed JSON or disabled routes.',
  },
  {
    name: 'referrer-policy',
    schema: ReferrerPolicyHeaderSchema,
    cardinality: 'single',
    presence: 'Same enabled-controller condition as Cache-Control.',
  },
] as const;
export const revision = 'ecda1b6e0d9bc39c66373452a92dce91e06abee0';
export const rateLimit = {
  id: 'newsletter.rate-limit',
  phase: 'application outcome',
  description:
    'After honeypot handling and payload validation, apply the configured limiter before service work. Denial is 429 with rounded-up Retry-After seconds; missing client key or limiter failure is sanitized 503. The limiter is host runtime logic.',
  fixtures: [
    'newsletter-rate-limit',
    'newsletter-limiter-unavailable',
    'newsletter-missing-client-key',
  ],
} as const satisfies SemanticRequirement;
export const nativeBehavior = {
  id: 'newsletter.native-actions',
  phase: 'application outcome',
  description:
    'Enabled POST actions accept strict token objects, including empty string, and return neutral 202. Token purpose, expiry, reuse and action semantics belong to the implementation. GET or disabled capabilities return 404 without invoking actions; do not expose tokens through response caching or referrers.',
  fixtures: [
    'newsletter-confirm-empty-token',
    'newsletter-unsubscribe-empty-token',
    'newsletter-confirm-get-not-supported',
    'newsletter-unsubscribe-get-not-supported',
    'newsletter-confirm-disabled',
    'newsletter-unsubscribe-disabled',
  ],
} as const satisfies SemanticRequirement;
