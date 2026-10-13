import type { z } from 'zod';
import type { HttpOperationDefinition } from '../../../../tools/contract-authoring/operation-definition.js';
import {
  NewsletterSubscribeRequestSchema,
  NewsletterAcceptedResponseSchema,
} from '../schemas/index.js';
import {
  json,
  response,
  badRequest,
  unavailable,
  rateLimited,
  rateLimit,
  revision,
} from './support.js';
export const subscribeToNewsletter = {
  domain: 'newsletter',
  capability: 'newsletter.subscription',
  operationId: 'subscribeToNewsletter',
  method: 'POST',
  path: '/newsletter/subscribe',
  tags: ['Newsletter'],
  summary: 'Request newsletter subscription',
  description:
    'Accept consent-bearing subscriptions or neutral honeypot submissions; host consent policy and evidence ordering remain explicit application obligations.',
  parameters: [],
  requestBody: json(NewsletterSubscribeRequestSchema),
  responses: {
    '202': response(
      NewsletterAcceptedResponseSchema,
      'success',
      'Neutral acceptance, including the honeypot short-circuit.',
    ),
    '400': badRequest,
    '429': rateLimited,
    '503': unavailable,
  },
  security: { kind: 'public' },
  availability: { kind: 'capability', capability: 'newsletter.subscription' },
  semantics: [
    {
      id: 'newsletter.honeypot',
      phase: 'pre-validation',
      description:
        'Any nonempty website string returns 202 before normal shape/length validation, rate limiting, context resolution or consent/provider work. Do not create evidence for this branch.',
      fixtures: [
        'newsletter-honeypot-bypasses-invalid-body',
        'newsletter-honeypot-bypasses-limiter',
      ],
    },
    {
      id: 'newsletter.strict-input',
      phase: 'normalization',
      description:
        'Normal subscription is strict, with no coercion or trimming. Lengths count UTF-16 code units, preserving Value.Check. Consent must be boolean true. Email lowercasing happens only in the application.',
      fixtures: [
        'newsletter-subscribe',
        'newsletter-email-whitespace',
        'newsletter-null-source',
      ],
    },
    rateLimit,
    {
      id: 'newsletter.consent-evidence',
      phase: 'application outcome',
      description:
        'Require the configured consent version and trusted context. Lowercase email; append grant evidence before subscriber transport. Storage failure prevents transport; transport failure returns sanitized 503 without deleting the grant. No transaction guarantee is inferred.',
      fixtures: [
        'newsletter-subscribe',
        'newsletter-stale-consent',
        'newsletter-storage-failure',
        'newsletter-provider-failure-keeps-grant',
      ],
    },
  ],
  compatibility: {
    revision,
    route: 'POST /newsletter/subscribe',
    fixtures: [
      'newsletter-subscribe',
      'newsletter-unknown-property',
      'newsletter-consent-string-not-coerced',
      'newsletter-consent-false',
      'newsletter-stale-consent',
      'newsletter-email-whitespace',
      'newsletter-null-source',
      'newsletter-honeypot-bypasses-invalid-body',
      'newsletter-honeypot-bypasses-limiter',
      'newsletter-rate-limit',
      'newsletter-limiter-unavailable',
      'newsletter-missing-client-key',
      'newsletter-storage-failure',
      'newsletter-provider-failure-keeps-grant',
    ],
    discrepancies: ['D03', 'D04'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;
