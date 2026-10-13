import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import cases from './cases.cjs';
import source from './source.cjs';

// Offline evidence checks only. Actual HTTP replay is the separate verify command.
const root = new URL('../../baselines/legacy-3tier/', import.meta.url);
const bytes = (name) => readFileSync(new URL(name, root));
const json = (name) => JSON.parse(bytes(name));
const provenance = json('provenance.json');
const routes = json('routes.json');
const http = json('http.json');
const spec = json('committed-openapi.json');
const metadata = json('route-metadata.json');
const fixture = (id) => {
  const value = http.find((entry) => entry.id === id);
  assert.ok(value, `Missing fixture ${id}`);
  return value;
};
const observed = (id) => fixture(id).observed;
const response = (id) => observed(id).responses[0];
const hash = (data) => createHash('sha256').update(data).digest('hex');

test('frozen artifacts and capture harness match the provenance hashes', () => {
  assert.equal(provenance.kind, 'legacy-implementation-evidence');
  assert.equal(provenance.revision, source.revision);
  const files = readdirSync(fileURLToPath(root)).filter((file) =>
    /\.(json|yaml)$/.test(file),
  );
  assert.deepEqual(
    files.sort(),
    [...Object.keys(provenance.artifacts), 'provenance.json'].sort(),
  );
  for (const [name, digest] of Object.entries(provenance.artifacts)) {
    assert.equal(hash(bytes(name)), digest, name);
  }
  for (const [name, digest] of Object.entries(provenance.harnessFiles)) {
    assert.equal(
      hash(readFileSync(new URL(name, import.meta.url))),
      digest,
      name,
    );
  }
  assert.ok(provenance.sourceFiles['yarn.lock']);
  for (const route of routes)
    assert.ok(provenance.sourceFiles[route.source], route.source);
});

test('legacy generation is byte reproducible, with the documented JWT and metadata gaps', () => {
  for (const extension of ['json', 'yaml']) {
    assert.deepEqual(
      bytes(`committed-openapi.${extension}`),
      bytes(`regenerated-openapi.${extension}`),
    );
  }
  assert.equal(spec.openapi, '3.1.0');
  const operations = Object.entries(spec.paths).flatMap(([path, methods]) =>
    Object.entries(methods).map(([method, operation]) => ({
      key: `${method.toUpperCase()} ${path}`,
      path,
      method,
      operation,
    })),
  );
  assert.equal(operations.length, 26);
  assert.equal(routes.length, 29);
  assert.equal(new Set(routes.map((route) => route.key)).size, routes.length);
  assert.equal(
    new Set(operations.map(({ operation }) => operation.operationId)).size,
    26,
  );
  const snapshot = json('committed-operation-snapshot.json');
  for (const { key, path, method, operation } of operations) {
    const route = routes.find((entry) => entry.key === key);
    assert.ok(route, key);
    assert.equal(operation.operationId, route.operationId, key);
    assert.equal(metadata[key], route.operationId, key);
    assert.equal(snapshot.paths[path][method], route.operationId, key);
    assert.ok(operation.responses[route.successStatus], key);
  }
  assert.deepEqual(
    routes
      .filter((route) => !operations.some(({ key }) => key === route.key))
      .map((route) => route.key),
    ['POST /auth/jwt/login', 'POST /auth/jwt/logout', 'POST /auth/jwt/refresh'],
  );
  assert.deepEqual(
    Object.keys(metadata).filter(
      (key) => !routes.some((route) => route.key === key),
    ),
    ['POST /auth/refresh-tokens/{userId}'],
  );
  assert.equal(response('auth-obsolete-refresh-route').status, 404);
});

test('every inventoried endpoint has an observed successful HTTP fixture', () => {
  assert.equal(new Set(http.map(({ id }) => id)).size, http.length);
  assert.deepEqual(
    http.map(({ observed: _observed, ...input }) => input),
    cases,
  );
  for (const entry of http)
    assert.deepEqual(
      entry.observed.responses.map(({ status }) => status),
      entry.statuses,
      entry.id,
    );
  // Resolve static routes before parameters: /forms/submissions must not
  // accidentally count as coverage for /forms/{formId}.
  const resolveRoute = (step) =>
    routes
      .filter(
        (route) =>
          route.method === step.method &&
          new RegExp(`^${route.path.replace(/\{[^}]+\}/g, '[^/]+')}$`).test(
            step.path.split('?')[0],
          ),
      )
      .sort(
        (a, b) =>
          (a.path.match(/\{/g)?.length ?? 0) -
          (b.path.match(/\{/g)?.length ?? 0),
      )[0];
  assert.equal(
    resolveRoute({ method: 'GET', path: '/forms/submissions' }).key,
    'GET /forms/submissions',
  );
  for (const route of routes) {
    assert.ok(
      http.some((entry) =>
        entry.steps.some(
          (step, i) =>
            resolveRoute(step)?.key === route.key &&
            entry.observed.responses[i].status === route.successStatus,
        ),
      ),
      route.key,
    );
  }
});

test('session cookies and ordered RBAC wire rules survive the legacy boundary', () => {
  const login = response('auth-login');
  assert.equal(login.headers['set-cookie'].length, 2);
  assert.equal(
    observed('auth-login').events[0].data.cookie,
    'incoming=fixture',
  );
  assert.deepEqual(Object.keys(login.body).sort(), ['rbac', 'user']);
  assert.deepEqual(
    response('auth-login-policy-wire-order').body.rbac,
    fixture('auth-login-policy-wire-order').controls.policyRules,
  );
  assert.match(response('auth-logout').headers['set-cookie'][0], /Max-Age=0/);
  assert.equal(response('auth-me-no-session-guarded').status, 401);
  assert.equal(response('passkey-guard-registration').status, 401);
  assert.equal(response('passkey-guard-public-authentication').status, 200);
  assert.deepEqual(
    observed('passkey-registration-strips-user-id').events[0].data.dto,
    {},
  );
  assert.equal(
    response('passkey-authentication-invalid-base64url').status,
    400,
  );
});

test('coercion, optional/null handling and serialized response fields remain explicit', () => {
  assert.equal(
    observed('auth-login-number-coercion').events[0].data.dto.password,
    '123456',
  );
  assert.equal(
    observed('forms-definition-default-version').events[0].data.version,
    1,
  );
  assert.equal(
    observed('forms-definition-query-coercion').events[0].data.version,
    2,
  );
  assert.equal(response('forms-submit-no-version').status, 400);
  assert.equal(response('forms-submit-string-version').body.formVersion, 2);
  // AJV takes the string branch first and coerces explicit null to ''.
  // Omitted fields still come back null from the repository response.
  assert.equal(response('identity-create-nullable').body.displayName, '');
  assert.equal(
    observed('identity-create-nullable').events[0].data.displayName,
    '',
  );
  assert.equal(response('identity-patch-null').body.displayName, '');
  assert.equal(response('identity-create').body.displayName, null);
  assert.ok(
    !Object.hasOwn(
      observed('identity-patch-empty').events[0].data,
      'displayName',
    ),
  );
  assert.equal(
    response('identity-create-number-coercion').body.displayName,
    '456',
  );
  assert.equal(
    response('identity-patch-owner-ignored').body.authUserId,
    'user-1',
  );
  assert.ok(
    !Object.hasOwn(
      response('identity-response-drops-extra').body,
      'internalOnly',
    ),
  );
  assert.equal(
    response('identity-create').body.createdAt,
    '2026-01-01T00:00:00.000Z',
  );
});

test('Forms validation bypass and delivery-secret exposure stay visible as review-required findings', () => {
  const definition = response('forms-definition-delivery-secret').body;
  assert.deepEqual(definition.schema.required, ['email']);
  assert.equal(definition.schema.additionalProperties, false);
  assert.equal(
    definition.config.delivery.webhooks[0].secret,
    'public-fixture-webhook-secret',
  );
  assert.deepEqual(
    response('forms-submit-missing-required-dynamic-field').body.payload,
    {},
  );
  assert.equal(
    response('forms-submit-invalid-dynamic-email').body.payload.email,
    'invalid',
  );
  assert.equal(
    response('forms-submit-unknown-payload-property').body.payload.extra,
    'preserved',
  );
});

test('Newsletter strict validation, neutral actions and failure ordering are captured', () => {
  for (const id of [
    'newsletter-unknown-property',
    'newsletter-consent-string-not-coerced',
    'newsletter-consent-false',
    'newsletter-stale-consent',
  ]) {
    assert.equal(response(id).status, 400);
    assert.deepEqual(observed(id).events, []);
  }
  for (const id of [
    'newsletter-honeypot-bypasses-invalid-body',
    'newsletter-honeypot-bypasses-limiter',
  ]) {
    assert.equal(response(id).status, 202);
    assert.deepEqual(observed(id).events, []);
  }
  assert.deepEqual(
    observed('newsletter-subscribe').events.map(({ name }) => name),
    ['appendGrant', 'subscribe'],
  );
  assert.equal(
    observed('newsletter-subscribe').events[0].data.email,
    'reader@example.test',
  );
  assert.deepEqual(observed('newsletter-storage-failure').events, []);
  assert.deepEqual(
    observed('newsletter-provider-failure-keeps-grant').events.map(
      ({ name }) => name,
    ),
    ['appendGrant', 'subscribe'],
  );
  assert.equal(response('newsletter-rate-limit').headers['retry-after'], '2');
  for (const action of ['confirm', 'unsubscribe']) {
    const result = response(`newsletter-${action}`);
    assert.deepEqual(result.body, { accepted: true });
    assert.equal(result.headers['cache-control'], 'no-store');
    assert.equal(result.headers['referrer-policy'], 'no-referrer');
    assert.equal(
      response(`newsletter-${action}-get-not-supported`).status,
      404,
    );
  }
});

test('webhook raw-byte verification rejects tampering before evidence writes', () => {
  for (const id of [
    'newsletter-webhook-missing-signature',
    'newsletter-webhook-changed-signed-bytes',
    'newsletter-webhook-wrong-account',
    'newsletter-webhook-size-limit',
    'newsletter-webhook-no-raw-body',
  ]) {
    assert.deepEqual(observed(id).events, [], id);
  }
  assert.deepEqual(
    observed('newsletter-webhook-duplicate').responses.map(({ body }) => body),
    [
      { recorded: 1, duplicates: 0 },
      { recorded: 0, duplicates: 1 },
    ],
  );
  const events = observed('newsletter-webhook-duplicate').events;
  assert.equal(events[0].data.dedupeKey, events[1].data.dedupeKey);
  for (const entry of http.filter(
    ({ host }) => host === 'newsletter' || host === 'native',
  )) {
    assert.ok(
      !JSON.stringify(entry.observed.responses).includes('private '),
      entry.id,
    );
  }
});
