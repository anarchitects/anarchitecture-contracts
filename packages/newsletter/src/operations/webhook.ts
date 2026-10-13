import type { z } from 'zod';
import type { HttpOperationDefinition } from '../../../../tools/contract-authoring/operation-definition.js';
import {
  NewsletterSignatureHeaderSchema,
  NewsletterWebhookPayloadSchema,
  NewsletterWebhookResponseSchema,
  UnauthorizedErrorSchema,
  PayloadTooLargeErrorSchema,
} from '../schemas/index.js';
import {
  response,
  badRequest,
  unavailable,
  disabled,
  revision,
} from './support.js';
export const receiveNewsletterWebhook = {
  domain: 'newsletter',
  capability: 'newsletter.webhook',
  operationId: 'receiveNewsletterWebhook',
  method: 'POST',
  path: '/newsletter/webhook',
  tags: ['Newsletter'],
  summary: 'Receive a signed newsletter webhook',
  description:
    'Verify the exact raw bytes before parsing or recording withdrawals. The parsed schema describes the audited MailerLite payload profile, not a generic provider protocol.',
  parameters: [
    {
      in: 'header',
      name: 'signature',
      required: true,
      schema: NewsletterSignatureHeaderSchema,
      description:
        'SHA-256 HMAC of the exact raw body, encoded as 64 hexadecimal characters. Shape validation does not verify authenticity.',
      serialization: { style: 'simple', explode: false },
    },
  ],
  requestBody: {
    kind: 'raw',
    required: true,
    mediaType: 'application/json',
    parsedSchema: NewsletterWebhookPayloadSchema,
    semantics: [
      'newsletter.signed-bytes',
      'newsletter.webhook-payload',
      'newsletter.withdrawal-order',
    ],
  },
  responses: {
    '200': response(
      NewsletterWebhookResponseSchema,
      'success',
      'Recorded and duplicate withdrawal counts.',
    ),
    '400': badRequest,
    '401': response(
      UnauthorizedErrorSchema,
      'error',
      'Missing, malformed or mismatched webhook signature.',
    ),
    '413': response(
      PayloadTooLargeErrorSchema,
      'error',
      'The configured raw-body byte limit was exceeded.',
    ),
    '503': unavailable,
    '404': disabled,
  },
  security: { kind: 'profile', binding: 'newsletter.webhook-signature' },
  availability: { kind: 'capability', capability: 'newsletter.webhook' },
  semantics: [
    {
      id: 'newsletter.signed-bytes',
      phase: 'authentication/authorization',
      description:
        'Require captured raw bytes, enforce the configured byte limit, then verify the signature with the host secret using constant-time comparison before UTF-8/JSON decoding. Never reserialize JSON for signature checking. Missing raw capture is 503; missing/invalid signature is 401; invalid signed UTF-8/JSON is 400. The host may reject malformed JSON before controller entry.',
      fixtures: [
        'newsletter-webhook-valid',
        'newsletter-webhook-missing-signature',
        'newsletter-webhook-changed-signed-bytes',
        'newsletter-webhook-size-limit',
        'newsletter-webhook-no-raw-body',
      ],
    },
    {
      id: 'newsletter.webhook-payload',
      phase: 'application outcome',
      description:
        'Use the parsed payload schema only after byte verification. Check every supplied top-level/event account_id against the configured account, enforce maxEvents and validate the entire batch before writes. Ignore well-formed unhandled event names. Native timestamp parseability and conditional event fields are additional generation constraints; no profile may silently omit them.',
      fixtures: [
        'newsletter-webhook-invalid-payload',
        'newsletter-webhook-wrong-account',
      ],
    },
    {
      id: 'newsletter.withdrawal-order',
      phase: 'application outcome',
      description:
        'Normalize withdrawal email in the owning service; preserve occurrence timestamp precision and stable event identity for deduplication. Only verified, fully validated events reach persistence. Return recorded/duplicates from persistence; storage failure is sanitized 503. Schema checks do not prove durable idempotency.',
      fixtures: [
        'newsletter-webhook-valid',
        'newsletter-webhook-duplicate',
        'newsletter-webhook-storage-failure',
      ],
    },
  ],
  compatibility: {
    revision,
    route: 'POST /newsletter/webhook',
    fixtures: [
      'newsletter-webhook-valid',
      'newsletter-webhook-missing-signature',
      'newsletter-webhook-changed-signed-bytes',
      'newsletter-webhook-invalid-payload',
      'newsletter-webhook-wrong-account',
      'newsletter-webhook-no-raw-body',
      'newsletter-webhook-storage-failure',
      'newsletter-webhook-size-limit',
      'newsletter-webhook-disabled',
      'newsletter-webhook-duplicate',
    ],
    discrepancies: ['D03', 'D09'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;
