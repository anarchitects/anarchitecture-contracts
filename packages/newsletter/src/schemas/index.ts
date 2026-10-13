import { z } from 'zod';
export * from './subscription.js';
import {
  NewsletterEmailSchema,
  NewsletterSubscriptionRequestSchema,
  NewsletterHoneypotRequestSchema,
  NewsletterSubscribeRequestSchema,
  NewsletterAcceptedResponseSchema,
  RetryAfterHeaderSchema,
} from './subscription.js';
export * from './native.js';
import {
  NewsletterNativeActionRequestSchema,
  CacheControlHeaderSchema,
  ReferrerPolicyHeaderSchema,
} from './native.js';
export * from './webhook.js';
import {
  NewsletterSignatureHeaderSchema,
  NewsletterWebhookIdentifierSchema,
  NewsletterWebhookTimestampSchema,
  NewsletterWebhookEventSchema,
  NewsletterWebhookPayloadSchema,
  NewsletterWebhookResponseSchema,
} from './webhook.js';
export * from './errors.js';
import {
  ValidationErrorSchema,
  BadRequestErrorSchema,
  UnauthorizedErrorSchema,
  ForbiddenErrorSchema,
  NotFoundErrorSchema,
  InternalServerErrorSchema,
  TooManyRequestsErrorSchema,
  PayloadTooLargeErrorSchema,
  ServiceUnavailableErrorSchema,
} from './errors.js';
export type NewsletterEmail = z.infer<typeof NewsletterEmailSchema>;
export type NewsletterSubscriptionRequestInput = z.input<
  typeof NewsletterSubscriptionRequestSchema
>;
export type NewsletterSubscriptionRequest = z.output<
  typeof NewsletterSubscriptionRequestSchema
>;
export type NewsletterHoneypotRequestInput = z.input<
  typeof NewsletterHoneypotRequestSchema
>;
export type NewsletterHoneypotRequest = z.output<
  typeof NewsletterHoneypotRequestSchema
>;
export type NewsletterSubscribeRequestInput = z.input<
  typeof NewsletterSubscribeRequestSchema
>;
export type NewsletterSubscribeRequest = z.output<
  typeof NewsletterSubscribeRequestSchema
>;
export type NewsletterAcceptedResponse = z.infer<
  typeof NewsletterAcceptedResponseSchema
>;
export type RetryAfterHeader = z.infer<typeof RetryAfterHeaderSchema>;
export type NewsletterNativeActionRequestInput = z.input<
  typeof NewsletterNativeActionRequestSchema
>;
export type NewsletterNativeActionRequest = z.output<
  typeof NewsletterNativeActionRequestSchema
>;
export type CacheControlHeader = z.infer<typeof CacheControlHeaderSchema>;
export type ReferrerPolicyHeader = z.infer<typeof ReferrerPolicyHeaderSchema>;
export type NewsletterSignatureHeader = z.infer<
  typeof NewsletterSignatureHeaderSchema
>;
export type NewsletterWebhookIdentifier = z.infer<
  typeof NewsletterWebhookIdentifierSchema
>;
export type NewsletterWebhookTimestamp = z.infer<
  typeof NewsletterWebhookTimestampSchema
>;
export type NewsletterWebhookEventInput = z.input<
  typeof NewsletterWebhookEventSchema
>;
export type NewsletterWebhookEvent = z.output<
  typeof NewsletterWebhookEventSchema
>;
export type NewsletterWebhookPayloadInput = z.input<
  typeof NewsletterWebhookPayloadSchema
>;
export type NewsletterWebhookPayload = z.output<
  typeof NewsletterWebhookPayloadSchema
>;
export type NewsletterWebhookResponse = z.infer<
  typeof NewsletterWebhookResponseSchema
>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type BadRequestErrorInput = z.input<typeof BadRequestErrorSchema>;
export type BadRequestError = z.output<typeof BadRequestErrorSchema>;
export type UnauthorizedError = z.infer<typeof UnauthorizedErrorSchema>;
export type ForbiddenError = z.infer<typeof ForbiddenErrorSchema>;
export type NotFoundError = z.infer<typeof NotFoundErrorSchema>;
export type InternalServerError = z.infer<typeof InternalServerErrorSchema>;
export type TooManyRequestsErrorInput = z.input<
  typeof TooManyRequestsErrorSchema
>;
export type TooManyRequestsError = z.output<typeof TooManyRequestsErrorSchema>;
export type PayloadTooLargeErrorInput = z.input<
  typeof PayloadTooLargeErrorSchema
>;
export type PayloadTooLargeError = z.output<typeof PayloadTooLargeErrorSchema>;
export type ServiceUnavailableError = z.infer<
  typeof ServiceUnavailableErrorSchema
>;
export const newsletterSchemas = Object.freeze({
  'newsletter.NewsletterEmail': NewsletterEmailSchema,
  'newsletter.NewsletterSubscriptionRequest':
    NewsletterSubscriptionRequestSchema,
  'newsletter.NewsletterHoneypotRequest': NewsletterHoneypotRequestSchema,
  'newsletter.NewsletterSubscribeRequest': NewsletterSubscribeRequestSchema,
  'newsletter.NewsletterAcceptedResponse': NewsletterAcceptedResponseSchema,
  'newsletter.RetryAfterHeader': RetryAfterHeaderSchema,
  'newsletter.NewsletterNativeActionRequest':
    NewsletterNativeActionRequestSchema,
  'newsletter.CacheControlHeader': CacheControlHeaderSchema,
  'newsletter.ReferrerPolicyHeader': ReferrerPolicyHeaderSchema,
  'newsletter.NewsletterSignatureHeader': NewsletterSignatureHeaderSchema,
  'newsletter.NewsletterWebhookIdentifier': NewsletterWebhookIdentifierSchema,
  'newsletter.NewsletterWebhookTimestamp': NewsletterWebhookTimestampSchema,
  'newsletter.NewsletterWebhookEvent': NewsletterWebhookEventSchema,
  'newsletter.NewsletterWebhookPayload': NewsletterWebhookPayloadSchema,
  'newsletter.NewsletterWebhookResponse': NewsletterWebhookResponseSchema,
  'newsletter.ValidationError': ValidationErrorSchema,
  'newsletter.BadRequestError': BadRequestErrorSchema,
  'newsletter.UnauthorizedError': UnauthorizedErrorSchema,
  'newsletter.ForbiddenError': ForbiddenErrorSchema,
  'newsletter.NotFoundError': NotFoundErrorSchema,
  'newsletter.InternalServerError': InternalServerErrorSchema,
  'newsletter.TooManyRequestsError': TooManyRequestsErrorSchema,
  'newsletter.PayloadTooLargeError': PayloadTooLargeErrorSchema,
  'newsletter.ServiceUnavailableError': ServiceUnavailableErrorSchema,
});
