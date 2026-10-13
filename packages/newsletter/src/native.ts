export * from './schemas/native.js';
export {
  confirmNewsletterSubscription,
  unsubscribeFromNewsletter,
} from './operations/native.js';
export { NewsletterAcceptedResponseSchema } from './schemas/subscription.js';
export type {
  NewsletterNativeActionRequest,
  NewsletterNativeActionRequestInput,
  CacheControlHeader,
  ReferrerPolicyHeader,
  NewsletterAcceptedResponse,
} from './schemas/index.js';
