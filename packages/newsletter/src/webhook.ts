export * from './schemas/webhook.js';
export { receiveNewsletterWebhook } from './operations/webhook.js';
export type {
  NewsletterSignatureHeader,
  NewsletterWebhookIdentifier,
  NewsletterWebhookTimestamp,
  NewsletterWebhookEvent,
  NewsletterWebhookEventInput,
  NewsletterWebhookPayload,
  NewsletterWebhookPayloadInput,
  NewsletterWebhookResponse,
} from './schemas/index.js';
