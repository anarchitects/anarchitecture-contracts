import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  NewsletterSignatureHeaderSchema,
  NewsletterWebhookPayloadSchema,
} from '@anarchitects/newsletter-contracts/webhook';

const subscriber = {
  id: '7',
  email: 'Reader@Example.test',
  unsubscribed_at: '2026-01-01 00:00:00.123456',
};
const event = {
  event: 'subscriber.unsubscribed',
  account_id: '42',
  subscriber,
};
test('webhook wire parsing preserves conditional fields, aliases, unknown events and batches without domain normalization', () => {
  for (const input of [
    event,
    { type: event.event, subscriber },
    { event: event.event, ...subscriber },
    {
      event: 'subscriber.deleted',
      subscriber: { id: 7, email: 'a@b.c', forget_at: '2026-01-01T00:00:00Z' },
    },
    { event: 'subscriber.created', ignored: { email: false } },
    { events: [event, { event: 'unhandled' }], extra: true },
    { account_id: 42, events: [] },
    { events: [], event: 123, subscriber: false },
  ])
    assert.deepEqual(NewsletterWebhookPayloadSchema.parse(input), input);
  for (const input of [
    {},
    [],
    { ...event, events: null },
    { ...event, type: 'subscriber.deleted' },
    { event: null, type: 'unhandled' },
    { event: ' ' },
    { ...event, subscriber: null },
    {
      ...event,
      subscriber: { ...subscriber, id: Number.MAX_SAFE_INTEGER + 1 },
    },
    { ...event, subscriber: { ...subscriber, unsubscribed_at: 'invalid' } },
    {
      ...event,
      subscriber: { ...subscriber, unsubscribed_at: '2026-99-99 00:00:00' },
    },
    { events: [event, { event: 'subscriber.unsubscribed' }] },
  ])
    assert.equal(
      NewsletterWebhookPayloadSchema.safeParse(input).success,
      false,
      JSON.stringify(input),
    );
});
test('signature shape does not imply successful HMAC verification', () => {
  for (const value of ['a'.repeat(64), 'ABCDEF'.repeat(10) + '1234'])
    assert.equal(
      NewsletterSignatureHeaderSchema.safeParse(value).success,
      true,
    );
  for (const value of [
    undefined,
    null,
    ['a'.repeat(64)],
    'a'.repeat(63),
    'a'.repeat(64) + '\n',
    'x'.repeat(64),
  ])
    assert.equal(
      NewsletterSignatureHeaderSchema.safeParse(value).success,
      false,
    );
});
