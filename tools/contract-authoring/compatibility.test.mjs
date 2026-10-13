import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { z } from 'zod';
import * as auth from '@anarchitects/auth-contracts';
import * as identity from '@anarchitects/identity-contracts';

const read = (file) =>
  JSON.parse(
    readFileSync(
      new URL(`../../baselines/legacy-3tier/${file}`, import.meta.url),
    ),
  );
const legacyRoutes = read('routes.json');
const fixtures = read('http.json');
const operations = [...auth.authOperations, ...identity.identityOperations];
// These are the pinned baseline's Fastify AJV options, used only as a test oracle.
// Neither package imports AJV, TypeBox, Fastify or the Bricks implementation.
const ajv = new Ajv({
  coerceTypes: 'array',
  useDefaults: true,
  removeAdditional: true,
  allErrors: false,
});
addFormats(ajv);
const bodySchema = (operation) =>
  operation.requestBody.kind === 'json'
    ? operation.requestBody.content['application/json']
    : undefined;
const match = (operation, step) =>
  operation.method === step.method &&
  new RegExp(`^${operation.path.replace(/\{[^}]+\}/g, '[^/]+')}$`).test(
    step.path.split('?')[0],
  );
const find = (id) => fixtures.find((fixture) => fixture.id === id);

function compare(schema, validate, input, label) {
  const oracle = structuredClone(input);
  const valid = validate(oracle);
  const result = schema.safeParse(input);
  assert.equal(
    result.success,
    valid,
    `${label}: acceptance mismatch for ${JSON.stringify(input)}; legacy errors ${JSON.stringify(validate.errors)}; Zod ${JSON.stringify(result.error?.issues)}`,
  );
  if (valid)
    assert.deepEqual(
      result.data,
      oracle,
      `${label}: normalization mismatch for ${JSON.stringify(input)}`,
    );
}

test('all 21 Auth/Identity routes retain methods, paths, statuses, tags and operation IDs', () => {
  const selected = legacyRoutes.filter(({ path }) =>
    /^\/(auth|identity)\//.test(path),
  );
  assert.equal(operations.length, 21);
  assert.deepEqual(
    operations.map(({ method, path }) => `${method} ${path}`).sort(),
    selected.map(({ key }) => key).sort(),
  );
  assert.equal(
    new Set(operations.map(({ operationId }) => operationId)).size,
    operations.length,
  );
  const newIds = {
    'POST /auth/jwt/login': 'loginWithJwt',
    'POST /auth/jwt/logout': 'logoutWithJwt',
    'POST /auth/jwt/refresh': 'refreshJwtTokens',
  };
  for (const legacy of selected) {
    const operation = operations.find(
      (op) => `${op.method} ${op.path}` === legacy.key,
    );
    assert.equal(
      operation.operationId,
      legacy.operationId ?? newIds[legacy.key],
    );
    assert.ok(operation.responses[legacy.successStatus]);
    assert.equal(
      operation.compatibility.revision,
      'ecda1b6e0d9bc39c66373452a92dce91e06abee0',
    );
    assert.ok(operation.compatibility.fixtures.length);
    assert.ok(operation.security.kind);
    assert.deepEqual(operation.tags, [
      operation.domain === 'auth' ? 'Auth' : 'Identity',
    ]);
  }
  assert.ok(
    !operations.some(({ operationId }) => operationId === 'refreshTokens'),
  );
});

test('frozen requests match legacy validation/mutation and all observed responses validate without mutation', () => {
  let requests = 0,
    responses = 0;
  for (const operation of operations) {
    const legacy = legacyRoutes.find(
      ({ key }) => key === `${operation.method} ${operation.path}`,
    );
    const validate = legacy.schema.body
      ? ajv.compile(legacy.schema.body)
      : undefined;
    for (const fixture of fixtures)
      for (const [index, step] of fixture.steps.entries()) {
        if (!match(operation, step)) continue;
        if (validate && step.body !== undefined) {
          compare(bodySchema(operation), validate, step.body, fixture.id);
          requests++;
        }
        const observed = fixture.observed.responses[index];
        const contract = operation.responses[observed.status];
        assert.ok(contract, `${fixture.id}: undocumented ${observed.status}`);
        assert.deepEqual(
          contract.body.content['application/json'].parse(observed.body),
          observed.body,
          fixture.id,
        );
        responses++;
        for (const header of contract.headers) {
          const value = observed.headers[header.name];
          if (value !== undefined)
            for (const item of header.cardinality === 'repeated'
              ? value
              : [value])
              header.schema.parse(item);
        }
      }
  }
  assert.ok(requests > 50);
  assert.ok(responses > 65);
});

const candidates = [
  undefined,
  null,
  true,
  false,
  0,
  1,
  -1,
  123456,
  1.5,
  1e21,
  1e-7,
  Infinity,
  -Infinity,
  -12345,
  '',
  ' ',
  '0',
  'true',
  'password',
  'a@b',
  'a..b@c',
  'A+B@EXAMPLE.C',
  'a@b.c',
  'a..b@c.test',
  'reader@example.test',
  'padded=',
  '\n',
  '😀',
  '😀😀😀',
  '😀'.repeat(6),
  '😀'.repeat(101),
  'x'.repeat(256),
  [],
  ['password'],
  [null],
  [0],
  [false],
  [1, 2],
  [['password']],
  {},
  { extra: true },
];
function fieldPaths(schema, value, prefix = []) {
  const paths = [];
  for (const [name, child] of Object.entries(schema.properties ?? {})) {
    paths.push([...prefix, name]);
    if (
      value?.[name] &&
      typeof value[name] === 'object' &&
      !Array.isArray(value[name])
    )
      paths.push(...fieldPaths(child, value[name], [...prefix, name]));
  }
  return paths;
}

test('expanded boundary corpus matches the pinned legacy validator, including Unicode and array coercion', () => {
  let comparisons = 0;
  for (const operation of operations) {
    const schema = bodySchema(operation);
    if (!schema) continue;
    const legacy = legacyRoutes.find(
      ({ key }) => key === `${operation.method} ${operation.path}`,
    );
    const validate = ajv.compile(legacy.schema.body);
    const seed = fixtures
      .flatMap((fixture) =>
        fixture.steps.filter(
          (step, i) =>
            match(operation, step) &&
            fixture.observed.responses[i].status === 200,
        ),
      )
      .find((step) => step.body !== undefined)?.body;
    assert.ok(seed, operation.operationId);
    for (const value of candidates) {
      compare(schema, validate, value, operation.operationId);
      comparisons++;
    }
    for (const path of fieldPaths(legacy.schema.body, seed))
      for (const value of candidates) {
        const input = structuredClone(seed);
        let parent = input;
        for (const key of path.slice(0, -1)) parent = parent[key];
        const key = path.at(-1);
        if (value === undefined) delete parent[key];
        else parent[key] = structuredClone(value);
        compare(
          schema,
          validate,
          input,
          `${operation.operationId}.${path.join('.')}`,
        );
        comparisons++;
      }
  }
  assert.ok(comparisons > 2000);
  console.log(
    `Compared ${comparisons} expanded request cases against the frozen AJV schemas.`,
  );
});

test('policy representation is lossless and never interprets rules or grants', () => {
  const rules = find('auth-login-policy-wire-order').observed.responses[0].body
    .rbac;
  assert.deepEqual(auth.PolicyRuleArraySchema.parse(rules), rules);
  assert.equal(
    auth.PolicyRuleArraySchema.safeParse([
      { ...rules[0], internalEvaluator: true },
    ]).success,
    false,
  );
  assert.equal(
    auth.LoggedInUserInfoResponseSchema.safeParse({
      user: {},
      rbac: [{ action: '', subject: 'all' }],
    }).success,
    false,
  );
  assert.equal(
    auth.LoggedInUserInfoResponseSchema.safeParse({ rbac: [] }).success,
    false,
  );
});

test('application rejections are distinct from transport parsing and password equality stays in the service', () => {
  for (const id of [
    'auth-register-mismatch',
    'auth-reset-mismatch',
    'auth-login-engine-denial',
    'jwt-refresh-invalidated',
  ]) {
    const fixture = find(id);
    const operation = operations.find((op) => match(op, fixture.steps[0]));
    assert.ok(
      bodySchema(operation).safeParse(fixture.steps[0].body).success,
      id,
    );
    assert.ok(fixture.observed.responses[0].status >= 400);
    assert.ok(
      operation.semantics.some(({ phase }) => phase === 'application outcome'),
    );
  }
});

test('security and cookie obligations stay explicit and Identity protection is unresolved, not anonymous', () => {
  for (const id of [
    'logout',
    'getLoggedInUserInfo',
    'changePassword',
    'updateEmail',
    'beginRegistration',
    'finishRegistration',
  ])
    assert.equal(
      operations.find(({ operationId }) => operationId === id).security.kind,
      'profile',
    );
  for (const operation of identity.identityOperations)
    assert.equal(operation.security.kind, 'profile');
  for (const id of [
    'loginWithJwt',
    'logoutWithJwt',
    'refreshJwtTokens',
    'beginAuthentication',
    'finishAuthentication',
  ])
    assert.equal(
      operations.find(({ operationId }) => operationId === id).security.kind,
      'public',
    );
  assert.equal(auth.login.responses[200].headers[0].cardinality, 'repeated');
  assert.equal(auth.getLoggedInUserInfo.responses[200].headers.length, 0);
  assert.ok(identity.identityProfiles.protected.unresolved);
});

test('output catalogs convert natively; request conversion fails closed on decoded numeric overflow', () => {
  for (const catalog of [auth.authSchemas, identity.identitySchemas]) {
    assert.equal(
      new Set(Object.values(catalog)).size,
      Object.keys(catalog).length,
    );
    for (const [id, schema] of Object.entries(catalog)) {
      const inputOnly =
        /(?:Request|Params|Credential)$|^identity\.ProfileId$/.test(id);
      const convert = () =>
        z.toJSONSchema(schema, {
          target: 'draft-2020-12',
          io: inputOnly ? 'input' : 'output',
          unrepresentable: 'throw',
        });
      const emptyBody = [
        'auth.LogoutRequest',
        'auth.passkeys.PasskeyAuthenticationBeginRequest',
      ].includes(id);
      if (inputOnly && !emptyBody)
        assert.throws(convert, /cannot be represented/, id);
      else assert.ok(Object.keys(convert()).length > 1, id);
    }
  }
  assert.equal(
    auth.SuccessResponseSchema.safeParse({ success: 'true' }).success,
    false,
  );
  assert.equal(
    identity.UserProfileResponseSchema.safeParse({
      ...find('identity-create').observed.responses[0].body,
      displayName: 123,
    }).success,
    false,
  );
});

test('raw JSON exponent overflow retains the pinned HTTP string normalization', () => {
  const authInput = JSON.parse(
    '{"credential":1e309,"password":1e309,"extra":{"number":-1e309}}',
  );
  assert.deepEqual(auth.LoginRequestSchema.parse(authInput), {
    credential: 'Infinity',
    password: 'Infinity',
    extra: { number: -Infinity },
  });
  const identityInput = JSON.parse('{"authUserId":1e309,"displayName":-1e309}');
  assert.deepEqual(
    identity.CreateUserProfileRequestSchema.parse(identityInput),
    { authUserId: 'Infinity', displayName: '-Infinity' },
  );
  for (const value of [NaN, 1n, new Date(), () => 1]) {
    assert.equal(
      auth.LoginRequestSchema.safeParse({
        credential: value,
        password: 'password',
      }).success,
      false,
    );
  }
});

test('path parameter normalization matches the frozen validator without narrowing IDs', () => {
  for (const operation of operations) {
    if (!operation.parameters.length) continue;
    const legacy = legacyRoutes.find(
      ({ key }) => key === `${operation.method} ${operation.path}`,
    );
    const validate = ajv.compile(legacy.schema.params);
    const schema = z.object(
      Object.fromEntries(
        operation.parameters.map((parameter) => [
          parameter.name,
          parameter.schema,
        ]),
      ),
    );
    assert.deepEqual(
      operation.path.match(/\{([^}]+)\}/g)?.map((part) => part.slice(1, -1)),
      operation.parameters.map(({ name }) => name),
    );
    for (const value of candidates)
      for (const parameter of operation.parameters)
        compare(
          schema,
          validate,
          { [parameter.name]: value },
          `${operation.operationId} parameter`,
        );
  }
});
