import type { z } from 'zod';
import type { HttpOperationDefinition } from '../../../../tools/contract-authoring/operation-definition.js';
import {
  NewsletterNativeActionRequestSchema,
  NewsletterAcceptedResponseSchema,
} from '../schemas/index.js';
import {
  json,
  response,
  badRequest,
  unavailable,
  disabled,
  rateLimited,
  nativeHeaders,
  nativeBehavior,
  rateLimit,
  revision,
} from './support.js';
const responses = {
  '202': {
    ...response(
      NewsletterAcceptedResponseSchema,
      'success',
      'Neutral action acceptance.',
    ),
    headers: nativeHeaders,
  },
  '400': { ...badRequest, headers: nativeHeaders },
  '429': {
    ...rateLimited,
    headers: [...nativeHeaders, ...rateLimited.headers],
  },
  '503': { ...unavailable, headers: nativeHeaders },
  '404': disabled,
} as const;
export const confirmNewsletterSubscription = {
  domain: 'newsletter',
  capability: 'newsletter.native',
  operationId: 'confirmNewsletterSubscription',
  method: 'POST',
  path: '/newsletter/confirm',
  tags: ['Newsletter'],
  summary: 'Confirm a newsletter subscription',
  description:
    'Invoke the enabled native confirmation action and return a neutral result.',
  parameters: [],
  requestBody: json(NewsletterNativeActionRequestSchema),
  responses,
  security: { kind: 'public' },
  availability: { kind: 'capability', capability: 'newsletter.native' },
  semantics: [nativeBehavior, rateLimit],
  compatibility: {
    revision,
    route: 'POST /newsletter/confirm',
    fixtures: [
      'newsletter-confirm',
      'newsletter-confirm-empty-token',
      'newsletter-confirm-wrong-type',
      'newsletter-confirm-unknown-field',
      'newsletter-confirm-failure',
      'newsletter-confirm-disabled',
    ],
    discrepancies: ['D03', 'D04', 'D09'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;
export const unsubscribeFromNewsletter = {
  domain: 'newsletter',
  capability: 'newsletter.native',
  operationId: 'unsubscribeFromNewsletter',
  method: 'POST',
  path: '/newsletter/unsubscribe',
  tags: ['Newsletter'],
  summary: 'Unsubscribe through a native action',
  description:
    'Invoke the enabled native unsubscribe action and return a neutral result.',
  parameters: [],
  requestBody: json(NewsletterNativeActionRequestSchema),
  responses,
  security: { kind: 'public' },
  availability: { kind: 'capability', capability: 'newsletter.native' },
  semantics: [nativeBehavior, rateLimit],
  compatibility: {
    revision,
    route: 'POST /newsletter/unsubscribe',
    fixtures: [
      'newsletter-unsubscribe',
      'newsletter-unsubscribe-empty-token',
      'newsletter-unsubscribe-wrong-type',
      'newsletter-unsubscribe-unknown-field',
      'newsletter-unsubscribe-failure',
      'newsletter-unsubscribe-disabled',
    ],
    discrepancies: ['D03', 'D04', 'D09'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;
