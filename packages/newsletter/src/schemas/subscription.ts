import { z } from 'zod';
import { decodedJson, utf16String } from './input.js';

// Value.Check used UTF-16 code units, unlike the Forms AJV boundary.
export const NewsletterEmailSchema = utf16String(254).regex(
  /^[^\s@]+@[^\s@]+\.[^\s@]+(?![\s\S])/,
);
export const NewsletterSubscriptionRequestSchema = z.strictObject({
  email: NewsletterEmailSchema,
  consent: z.literal(true),
  consentVersion: z.string().min(1).regex(/\S/),
  source: utf16String(2048).optional(),
  website: utf16String(2048).optional(),
});
// Any nonempty honeypot string short-circuits before length/shape validation.
// Extra decoded JSON fields survive; this branch must never create consent.
export const NewsletterHoneypotRequestSchema = z
  .object({ website: z.string().min(1) })
  .catchall(decodedJson);
export const NewsletterSubscribeRequestSchema = z.union([
  NewsletterHoneypotRequestSchema,
  NewsletterSubscriptionRequestSchema,
]);
export const NewsletterAcceptedResponseSchema = z.strictObject({
  accepted: z.literal(true),
});
export const RetryAfterHeaderSchema = z.string().regex(/^\d+(?![\s\S])/);
