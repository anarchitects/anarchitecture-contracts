// Supplemental extraction probes against the immutable #3 implementation.
// Synthetic public fixture data only. These are not deployment credentials.
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
const webhook = (id, body) => ({
  id: `si6-webhook-${id}`,
  host: 'newsletter',
  steps: [
    { method: 'POST', path: '/newsletter/webhook', body, signature: 'valid' },
  ],
});
export const legacy6Cases = [
  webhook('batch', { events: [event, { event: 'subscriber.created' }] }),
  webhook('empty-batch', { account_id: 42, events: [] }),
  webhook('batch-ignores-envelope-fields', {
    events: [],
    event: 123,
    subscriber: false,
  }),
  webhook('unknown-event', { event: 'subscriber.created', subscriber: false }),
  webhook('type-alias', { type: event.event, subscriber }),
  webhook('top-level-subscriber', { event: event.event, ...subscriber }),
  webhook('deleted-fallback', {
    event: 'subscriber.deleted',
    subscriber: {
      id: 7,
      email: 'a@b.c',
      forget_at: '2026-01-01T00:00:00.123456Z',
    },
  }),
  webhook('null-timestamp-fallback', {
    ...event,
    subscriber: {
      ...subscriber,
      unsubscribed_at: null,
      updated_at: '2026-01-01T00:00:00Z',
    },
  }),
  webhook('invalid-timestamp', {
    ...event,
    subscriber: { ...subscriber, unsubscribed_at: '2026-99-99 00:00:00' },
  }),
  webhook('conflicting-name', { ...event, type: 'subscriber.deleted' }),
  webhook('null-name', { event: null, type: 'unhandled' }),
  webhook('unsafe-id', {
    ...event,
    subscriber: { ...subscriber, id: Number.MAX_SAFE_INTEGER + 1 },
  }),
  webhook('blank-email', {
    ...event,
    subscriber: { ...subscriber, email: ' a@b.c' },
  }),
  webhook('utf16-email', {
    ...event,
    subscriber: { ...subscriber, email: '😀'.repeat(126) + '@a.b' },
  }),
  webhook('entire-batch-before-writes', {
    events: [event, { event: 'subscriber.unsubscribed' }],
  }),
  webhook('invalid-batch-no-single-fallback', { ...event, events: null }),
  webhook('wrong-account-unknown-event', {
    event: 'unhandled',
    account_id: '43',
  }),
  webhook('array-root', [event]),
  {
    id: 'si6-honeypot-over-limit',
    host: 'newsletter',
    controls: { rateLimited: true },
    steps: [
      {
        method: 'POST',
        path: '/newsletter/subscribe',
        body: { website: 'x'.repeat(2049), consent: false, ignored: 1 },
      },
    ],
  },
  {
    id: 'si6-native-utf16-limit',
    host: 'native',
    steps: [
      {
        method: 'POST',
        path: '/newsletter/confirm',
        body: { token: '😀'.repeat(65) },
      },
    ],
  },
  {
    id: 'si6-native-malformed-json',
    host: 'native',
    steps: [{ method: 'POST', path: '/newsletter/confirm', rawBody: '{' }],
  },
  {
    id: 'si6-forms-string-infinity',
    host: 'core',
    steps: [
      {
        method: 'POST',
        path: '/forms/submit',
        body: { formId: 'contact', formVersion: 'Infinity', payload: {} },
      },
    ],
  },
  {
    id: 'si6-forms-duplicate-version',
    host: 'core',
    steps: [
      { method: 'GET', path: '/forms/contact?formVersion=1&formVersion=2' },
    ],
  },
];
