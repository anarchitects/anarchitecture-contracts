import { z } from 'zod';
import { decodedJson } from './input.js';
import { NewsletterEmailSchema } from './subscription.js';

export const NewsletterSignatureHeaderSchema = z
  .string()
  .length(64)
  .regex(/^[a-fA-F\d]{64}$/);
export const NewsletterWebhookIdentifierSchema = z.union([
  z.string().regex(/^\d+(?![\s\S])/),
  z.number().int().min(0),
]);
export const NewsletterWebhookTimestampSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})?$/,
  )
  .refine(
    (value) => Number.isFinite(Date.parse(value)),
    'Expected a parseable event timestamp',
  );
const open = <T extends z.ZodRawShape>(shape: T) =>
  z.object(shape).catchall(decodedJson);
const subscriber = open({
  id: NewsletterWebhookIdentifierSchema,
  email: NewsletterEmailSchema,
});
const event = open({
  event: z.string().optional(),
  type: z.string().optional(),
  account_id: NewsletterWebhookIdentifierSchema.optional(),
});
export const NewsletterWebhookEventSchema = event.superRefine(
  (value, context) => {
    const name = value.event ?? value.type;
    if (
      !name?.trim() ||
      (value.event !== undefined &&
        value.type !== undefined &&
        value.event !== value.type)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Expected a nonblank, consistent event name',
      });
      return;
    }
    if (name !== 'subscriber.unsubscribed' && name !== 'subscriber.deleted')
      return;
    const data = Object.hasOwn(value, 'subscriber') ? value.subscriber : value;
    const parsed = subscriber.safeParse(data);
    if (!parsed.success) {
      context.addIssue({
        code: 'custom',
        message: 'Expected a withdrawal subscriber id and email',
      });
      return;
    }
    const changedAt =
      name === 'subscriber.unsubscribed'
        ? (parsed.data.unsubscribed_at ?? parsed.data.updated_at)
        : (parsed.data.deleted_at ??
          parsed.data.forget_at ??
          parsed.data.updated_at);
    if (!NewsletterWebhookTimestampSchema.safeParse(changedAt).success)
      context.addIssue({
        code: 'custom',
        message: 'Expected the withdrawal occurrence timestamp',
      });
  },
);
const batch = open({
  account_id: NewsletterWebhookIdentifierSchema.optional(),
  events: z.array(NewsletterWebhookEventSchema),
});
// Presence of events selects the batch branch; an invalid batch must not fall
// through to a valid single event. Account equality and maxEvents are host policy.
const single = NewsletterWebhookEventSchema.refine(
  (value) => !Object.hasOwn(value, 'events'),
  'An events property requires a valid batch',
);
export const NewsletterWebhookPayloadSchema = z.union([batch, single]);
export const NewsletterWebhookResponseSchema = z.strictObject({
  recorded: z.number().multipleOf(1).min(0),
  duplicates: z.number().multipleOf(1).min(0),
});
