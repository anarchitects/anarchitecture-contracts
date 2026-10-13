import { z } from 'zod';
import { utf16String } from './input.js';
export const NewsletterNativeActionRequestSchema = z.strictObject({
  token: utf16String(128),
});
export const CacheControlHeaderSchema = z.literal('no-store');
export const ReferrerPolicyHeaderSchema = z.literal('no-referrer');
