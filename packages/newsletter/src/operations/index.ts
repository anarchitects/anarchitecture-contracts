import { subscribeToNewsletter } from './subscription.js';
import {
  confirmNewsletterSubscription,
  unsubscribeFromNewsletter,
} from './native.js';
import { receiveNewsletterWebhook } from './webhook.js';
export * from './subscription.js';
export * from './native.js';
export * from './webhook.js';
export const newsletterOperations = Object.freeze([
  subscribeToNewsletter,
  confirmNewsletterSubscription,
  unsubscribeFromNewsletter,
  receiveNewsletterWebhook,
] as const);
export type NewsletterOperation = (typeof newsletterOperations)[number];
export const newsletterProfiles = Object.freeze({
  subscription: {
    capabilities: ['newsletter.subscription'],
    requiredBindings: [
      'consent version/text',
      'trusted request context',
      'rate-limit policy',
    ],
    unresolved: true,
  },
  native: {
    capabilities: ['newsletter.subscription', 'newsletter.native'],
    requiredBindings: [
      'consent version/text',
      'native action lifecycle',
      'rate-limit policy',
    ],
    unresolved: true,
  },
  'subscription-webhook': {
    capabilities: ['newsletter.subscription', 'newsletter.webhook'],
    protection: 'newsletter.webhook-signature',
    requiredBindings: [
      'consent version/text',
      'rate-limit policy',
      'raw-body capture',
      'signature secret',
      'account id',
      'byte/event limits',
      'withdrawal persistence',
    ],
    unresolved: true,
  },
} as const);
