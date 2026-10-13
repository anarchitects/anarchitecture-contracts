// Public, synthetic inputs only. These are legacy observations, not new API contracts.
const cases = [];
function add(id, host, method, path, body, status, controls = {}, extra = {}) {
  cases.push({
    id,
    host,
    controls,
    steps: [
      { method, path, ...(body === undefined ? {} : { body }), ...extra },
    ],
    statuses: [status],
  });
}
const post = (id, path, body, status = 200, controls = {}, extra = {}) =>
  add(id, 'core', 'POST', path, body, status, controls, extra);
const password = 'password';
const register = {
  email: 'reader@example.test',
  password,
  confirmPassword: password,
};
const login = { credential: 'reader@example.test', password };
post('auth-register', '/auth/register', register);
post(
  'auth-register-empty-optional-name',
  '/auth/register',
  { ...register, name: '' },
  400,
);
post(
  'auth-register-missing-password',
  '/auth/register',
  { email: register.email },
  400,
);
post(
  'auth-register-short-password',
  '/auth/register',
  { ...register, password: 'short' },
  400,
);
post(
  'auth-register-mismatch',
  '/auth/register',
  { ...register, confirmPassword: 'different' },
  400,
);
post(
  'auth-register-malformed-email',
  '/auth/register',
  { ...register, email: 'bad' },
  400,
);
post(
  'auth-register-null-name',
  '/auth/register',
  { ...register, name: null },
  400,
);
post('auth-register-unknown-property', '/auth/register', {
  ...register,
  extra: 'preserved',
});
post('auth-register-existing', '/auth/register', register, 400, {
  existingUser: true,
});
post(
  'auth-login',
  '/auth/login',
  login,
  200,
  {},
  { headers: { cookie: 'incoming=fixture' } },
);
post('auth-login-engine-denial', '/auth/login', login, 401, {
  engineReject: true,
});
post('auth-login-policy-wire-order', '/auth/login', login, 200, {
  policyRules: [
    {
      action: 'read',
      subject: 'Profile',
      fields: ['displayName'],
      conditions: { authUserId: 'user-1' },
      inverted: false,
    },
    {
      action: 'read',
      subject: 'Profile',
      fields: ['email'],
      conditions: { private: true },
      inverted: true,
      reason: 'private fixture fields',
    },
  ],
});
post('auth-login-number-coercion', '/auth/login', {
  credential: 123456,
  password: 123456,
});
post(
  'auth-login-short-password',
  '/auth/login',
  { ...login, password: 'short' },
  400,
);
post(
  'auth-logout',
  '/auth/logout',
  {},
  200,
  {},
  { headers: { cookie: 'better-auth.session=baseline' } },
);
post('auth-logout-strips-unknown', '/auth/logout', {
  refreshToken: 'not-used',
});
add(
  'auth-activate',
  'core',
  'PATCH',
  '/auth/activate',
  { token: 'fixture-token' },
  200,
);
post('auth-forgot-password', '/auth/forgot-password', {
  email: register.email,
});
post('auth-reset-password', '/auth/reset-password', {
  token: 'fixture-token',
  password,
  confirmPassword: password,
});
post(
  'auth-reset-mismatch',
  '/auth/reset-password',
  { token: 'fixture-token', password, confirmPassword: 'different' },
  400,
);
post(
  'auth-reset-invalid-token',
  '/auth/reset-password',
  { token: 'fixture-token', password, confirmPassword: password },
  400,
  { engineReject: true },
);
post('auth-verify-email', '/auth/verify-email', { token: 'fixture-token' });
post(
  'auth-verify-invalid-token',
  '/auth/verify-email',
  { token: 'fixture-token' },
  400,
  { engineReject: true },
);
add(
  'auth-change-password',
  'core',
  'PATCH',
  '/auth/change-password/user-1',
  {
    currentPassword: password,
    newPassword: 'newpassword',
    confirmPassword: 'newpassword',
  },
  200,
);
add(
  'auth-change-wrong-password',
  'core',
  'PATCH',
  '/auth/change-password/user-1',
  {
    currentPassword: 'incorrect',
    newPassword: 'newpassword',
    confirmPassword: 'newpassword',
  },
  400,
);
add(
  'auth-update-email',
  'core',
  'PATCH',
  '/auth/update-email/user-1',
  { newEmail: 'updated@example.test', password },
  200,
);
add(
  'auth-me',
  'core',
  'GET',
  '/auth/me',
  undefined,
  200,
  {},
  { headers: { cookie: 'better-auth.session=baseline' } },
);
add('auth-me-no-session-unguarded', 'core', 'GET', '/auth/me', undefined, 400);
add('auth-me-no-session-guarded', 'guarded', 'GET', '/auth/me', undefined, 401);
add(
  'auth-guard-valid-session',
  'guarded',
  'GET',
  '/auth/me',
  undefined,
  200,
  {},
  { headers: { cookie: 'better-auth.session=baseline' } },
);
add(
  'auth-guard-invalid-session',
  'guarded',
  'GET',
  '/auth/me',
  undefined,
  401,
  {},
  { headers: { cookie: 'better-auth.session=invalid' } },
);
add('auth-guard-public-login', 'guarded', 'POST', '/auth/login', login, 200);
add(
  'passkey-guard-registration',
  'guarded',
  'POST',
  '/auth/passkeys/registration/begin',
  {},
  401,
);
add(
  'passkey-guard-public-authentication',
  'guarded',
  'POST',
  '/auth/passkeys/authentication/begin',
  {},
  200,
);
post('passkey-registration-begin', '/auth/passkeys/registration/begin', {});
post(
  'passkey-registration-strips-user-id',
  '/auth/passkeys/registration/begin',
  { userId: 'attacker' },
);
post(
  'passkey-registration-invalid-attachment',
  '/auth/passkeys/registration/begin',
  { authenticatorAttachment: 'unknown' },
  400,
);
const credential = {
  id: 'Y3JlZA',
  rawId: 'Y3JlZA',
  type: 'public-key',
  clientExtensionResults: {},
  response: { clientDataJSON: 'Y2xpZW50', attestationObject: 'YXR0ZXN0' },
};
post('passkey-registration-finish', '/auth/passkeys/registration/finish', {
  response: credential,
  name: 'Fixture key',
});
post(
  'passkey-registration-missing-response',
  '/auth/passkeys/registration/finish',
  {},
  400,
);
const assertion = {
  ...credential,
  response: {
    clientDataJSON: 'Y2xpZW50',
    authenticatorData: 'YXV0aA',
    signature: 'c2ln',
    userHandle: null,
  },
};
post('passkey-authentication-begin', '/auth/passkeys/authentication/begin', {});
post(
  'passkey-authentication-finish-null-handle',
  '/auth/passkeys/authentication/finish',
  { response: assertion },
);
post(
  'passkey-authentication-verifier-rejects',
  '/auth/passkeys/authentication/finish',
  { response: assertion },
  401,
  { engineReject: true },
);
post(
  'passkey-authentication-invalid-base64url',
  '/auth/passkeys/authentication/finish',
  { response: { ...assertion, id: 'padded=' } },
  400,
);
post('jwt-login', '/auth/jwt/login', login);
post(
  'jwt-invalid-password',
  '/auth/jwt/login',
  { ...login, password: 'incorrect' },
  400,
);
post(
  'jwt-refresh-invalid-token',
  '/auth/jwt/refresh',
  { refreshToken: 'invalid' },
  400,
);
post(
  'jwt-logout-invalid-token',
  '/auth/jwt/logout',
  { refreshToken: 'invalid' },
  400,
);
const { createHmac } = require('node:crypto');
const tokenInput = [
  { alg: 'HS256', typ: 'JWT' },
  { sub: 'user-1', exp: 4102444800 },
]
  .map((x) => Buffer.from(JSON.stringify(x)).toString('base64url'))
  .join('.');
const token = `${tokenInput}.${createHmac('sha256', 'public-jwt-fixture-secret').update(tokenInput).digest('base64url')}`;
post('jwt-refresh', '/auth/jwt/refresh', { refreshToken: token });
post('jwt-logout', '/auth/jwt/logout', {
  refreshToken: token,
  accessToken: 'fixture-access-token',
});
post(
  'jwt-refresh-invalidated',
  '/auth/jwt/refresh',
  { refreshToken: token },
  400,
  { invalidatedToken: true },
);
post(
  'auth-obsolete-refresh-route',
  '/auth/refresh-tokens/user-1',
  { refreshToken: 'invalid' },
  404,
);

add(
  'forms-definition-default-version',
  'core',
  'GET',
  '/forms/contact',
  undefined,
  200,
);
add(
  'forms-definition-query-coercion',
  'core',
  'GET',
  '/forms/contact?formVersion=2',
  undefined,
  200,
);
add(
  'forms-definition-delivery-secret',
  'core',
  'GET',
  '/forms/contact',
  undefined,
  200,
  { formDelivery: true },
);
add(
  'forms-definition-invalid-version',
  'core',
  'GET',
  '/forms/contact?formVersion=0',
  undefined,
  400,
);
add(
  'forms-definition-missing',
  'core',
  'GET',
  '/forms/missing',
  undefined,
  404,
);
add(
  'forms-list-filters',
  'core',
  'GET',
  '/forms/submissions?formId=contact&formVersion=2',
  undefined,
  200,
);
add(
  'forms-list-unknown-query',
  'core',
  'GET',
  '/forms/submissions?limit=10&offset=2',
  undefined,
  200,
);
add(
  'forms-detail',
  'core',
  'GET',
  '/forms/submissions/01900000-0000-7000-8000-000000000001',
  undefined,
  200,
);
add(
  'forms-detail-missing',
  'core',
  'GET',
  '/forms/submissions/01900000-0000-7000-8000-000000000002',
  undefined,
  404,
);
add(
  'forms-detail-invalid-uuid',
  'core',
  'GET',
  '/forms/submissions/invalid',
  undefined,
  400,
);
const submission = {
  formId: 'contact',
  formVersion: 1,
  payload: { email: 'reader@example.test' },
};
post('forms-submit', '/forms/submit', submission);
post(
  'forms-submit-no-version',
  '/forms/submit',
  { formId: 'contact', payload: {} },
  400,
);
post('forms-submit-string-version', '/forms/submit', {
  ...submission,
  formVersion: '2',
});
post('forms-submit-missing-required-dynamic-field', '/forms/submit', {
  ...submission,
  payload: {},
});
post('forms-submit-invalid-dynamic-email', '/forms/submit', {
  ...submission,
  payload: { email: 'invalid' },
});
post('forms-submit-unknown-payload-property', '/forms/submit', {
  ...submission,
  payload: { email: 'reader@example.test', extra: 'preserved' },
});
post(
  'forms-submit-null-payload',
  '/forms/submit',
  { ...submission, payload: null },
  400,
);
post(
  'forms-submit-malformed-json',
  '/forms/submit',
  undefined,
  400,
  {},
  { rawBody: '{' },
);

post('identity-create', '/identity/profiles', { authUserId: 'new-user' });
post(
  'identity-response-drops-extra',
  '/identity/profiles',
  { authUserId: 'new-user' },
  200,
  { responseExtra: true },
);
post('identity-create-nullable', '/identity/profiles', {
  authUserId: 'new-user',
  displayName: null,
  locale: null,
});
post('identity-create-number-coercion', '/identity/profiles', {
  authUserId: 123,
  displayName: 456,
});
post('identity-create-extra-fields', '/identity/profiles', {
  authUserId: 'new-user',
  extra: 'dropped-by-mapper',
});
post(
  'identity-create-duplicate',
  '/identity/profiles',
  { authUserId: 'user-1' },
  400,
);
post('identity-create-missing-owner', '/identity/profiles', {}, 400);
add(
  'identity-get-by-id',
  'core',
  'GET',
  '/identity/profiles/profile-1',
  undefined,
  200,
);
add(
  'identity-get-by-auth-user',
  'core',
  'GET',
  '/identity/profiles/by-auth-user/user-1',
  undefined,
  200,
);
add(
  'identity-get-missing',
  'core',
  'GET',
  '/identity/profiles/missing',
  undefined,
  404,
);
add(
  'identity-invalid-param',
  'core',
  'GET',
  '/identity/profiles/%20',
  undefined,
  400,
);
add(
  'identity-patch-null',
  'core',
  'PATCH',
  '/identity/profiles/profile-1',
  { displayName: null },
  200,
);
add(
  'identity-patch-empty',
  'core',
  'PATCH',
  '/identity/profiles/profile-1',
  {},
  200,
);
add(
  'identity-patch-owner-ignored',
  'core',
  'PATCH',
  '/identity/profiles/profile-1',
  { authUserId: 'attacker' },
  200,
);
add(
  'identity-patch-invalid-shape',
  'core',
  'PATCH',
  '/identity/profiles/profile-1',
  { displayName: {} },
  400,
);
add(
  'identity-patch-missing',
  'core',
  'PATCH',
  '/identity/profiles/missing',
  {},
  404,
);

const subscription = {
  email: 'Reader@Example.test',
  consent: true,
  consentVersion: 'v1',
};
const news = (id, path, body, status, controls = {}, extra = {}) =>
  add(id, 'newsletter', 'POST', path, body, status, controls, extra);
news('newsletter-subscribe', '/newsletter/subscribe', subscription, 202);
news(
  'newsletter-unknown-property',
  '/newsletter/subscribe',
  { ...subscription, extra: true },
  400,
);
news(
  'newsletter-consent-string-not-coerced',
  '/newsletter/subscribe',
  { ...subscription, consent: 'true' },
  400,
);
news(
  'newsletter-consent-false',
  '/newsletter/subscribe',
  { ...subscription, consent: false },
  400,
);
news(
  'newsletter-stale-consent',
  '/newsletter/subscribe',
  { ...subscription, consentVersion: 'old' },
  400,
);
news(
  'newsletter-email-whitespace',
  '/newsletter/subscribe',
  { ...subscription, email: ' reader@example.test' },
  400,
);
news(
  'newsletter-null-source',
  '/newsletter/subscribe',
  { ...subscription, source: null },
  400,
);
news(
  'newsletter-honeypot-bypasses-invalid-body',
  '/newsletter/subscribe',
  { website: 'bot' },
  202,
);
news(
  'newsletter-honeypot-bypasses-limiter',
  '/newsletter/subscribe',
  { website: 'bot' },
  202,
  { rateLimited: true },
);
news('newsletter-rate-limit', '/newsletter/subscribe', subscription, 429, {
  rateLimited: true,
});
news(
  'newsletter-limiter-unavailable',
  '/newsletter/subscribe',
  subscription,
  503,
  { limiterUnavailable: true },
);
news(
  'newsletter-missing-client-key',
  '/newsletter/subscribe',
  subscription,
  503,
  { missingClientKey: true },
);
news('newsletter-storage-failure', '/newsletter/subscribe', subscription, 503, {
  storageUnavailable: true,
});
news(
  'newsletter-provider-failure-keeps-grant',
  '/newsletter/subscribe',
  subscription,
  503,
  { subscriberUnavailable: true },
);
const webhook =
  '{ "event": "subscriber.unsubscribed", "account_id": "42", "subscriber": { "id": "7", "email": "Reader@Example.test", "unsubscribed_at": "2026-01-01 00:00:00" } }';
news(
  'newsletter-webhook-valid',
  '/newsletter/webhook',
  undefined,
  200,
  {},
  { rawBody: webhook, signature: 'valid' },
);
news(
  'newsletter-webhook-missing-signature',
  '/newsletter/webhook',
  undefined,
  401,
  {},
  { rawBody: webhook },
);
news(
  'newsletter-webhook-changed-signed-bytes',
  '/newsletter/webhook',
  undefined,
  401,
  {},
  { rawBody: webhook, signature: 'tampered' },
);
news(
  'newsletter-webhook-invalid-payload',
  '/newsletter/webhook',
  {},
  400,
  {},
  { signature: 'valid' },
);
news(
  'newsletter-webhook-wrong-account',
  '/newsletter/webhook',
  undefined,
  400,
  {},
  { rawBody: webhook.replace('"42"', '"43"'), signature: 'valid' },
);
news(
  'newsletter-webhook-no-raw-body',
  '/newsletter/webhook',
  undefined,
  503,
  { noRawBody: true },
  { rawBody: webhook, signature: 'valid' },
);
news(
  'newsletter-webhook-storage-failure',
  '/newsletter/webhook',
  undefined,
  503,
  { storageUnavailable: true },
  { rawBody: webhook, signature: 'valid' },
);
news(
  'newsletter-webhook-size-limit',
  '/newsletter/webhook',
  { ignored: 'x'.repeat(1024) },
  413,
  {},
  { signature: 'valid' },
);
news('newsletter-webhook-disabled', '/newsletter/webhook', {}, 404, {
  webhookDisabled: true,
});
cases.push({
  id: 'newsletter-webhook-duplicate',
  host: 'newsletter',
  steps: Array.from({ length: 2 }, () => ({
    method: 'POST',
    path: '/newsletter/webhook',
    rawBody: webhook,
    signature: 'valid',
  })),
  statuses: [200, 200],
});
for (const action of ['confirm', 'unsubscribe']) {
  const path = `/newsletter/${action}`;
  add(
    `newsletter-${action}`,
    'native',
    'POST',
    path,
    { token: 'fixture-token' },
    202,
  );
  add(
    `newsletter-${action}-empty-token`,
    'native',
    'POST',
    path,
    { token: '' },
    202,
  );
  add(
    `newsletter-${action}-wrong-type`,
    'native',
    'POST',
    path,
    { token: 12 },
    400,
  );
  add(
    `newsletter-${action}-unknown-field`,
    'native',
    'POST',
    path,
    { token: 'fixture-token', email: 'private@example.test' },
    400,
  );
  add(
    `newsletter-${action}-failure`,
    'native',
    'POST',
    path,
    { token: 'fixture-token' },
    503,
    { actionsUnavailable: true },
  );
  add(
    `newsletter-${action}-disabled`,
    'native',
    'POST',
    path,
    { token: 'fixture-token' },
    404,
    { nativeDisabled: true },
  );
  add(
    `newsletter-${action}-get-not-supported`,
    'native',
    'GET',
    `${path}?token=fixture-token`,
    undefined,
    404,
  );
}

module.exports = cases;
