import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as auth from '@anarchitects/auth-contracts';

test('session factory fixes stricter and relaxed profile gaps without changing JWT or default exports', () => {
  for (const [minLength, password, accepted] of [
    [10, '12345678', false],
    [3, '1234', true],
  ]) {
    const config = structuredClone(auth.DefaultAuthContractConfig);
    config.login.password.minLength = minLength;
    const contracts = auth.createAuthContracts(config);
    const input = { credential: 'person@example.com', password };
    assert.equal(
      contracts.loginRequestSchema.safeParse(input).success,
      accepted,
    );
    assert.equal(
      contracts.operations.find((op) => op.operationId === 'login').requestBody
        .content['application/json'],
      contracts.loginRequestSchema,
    );
    assert.equal(
      contracts.operations.find((op) => op.operationId === 'loginWithJwt'),
      auth.loginWithJwt,
    );
    assert.equal(
      contracts.schemas['auth.jwt.LoginRequest'],
      auth.LoginRequestSchema,
    );
    assert.equal(
      contracts.schemas['auth.LoginRequest'],
      contracts.loginRequestSchema,
    );
    config.login.password.minLength = 100;
    assert.equal(contracts.config.login.password.minLength, minLength);
    assert.ok(Object.isFrozen(contracts.config.login.password));
    assert.equal(
      contracts.loginRequestSchema.safeParse(input).success,
      accepted,
    );
  }
  assert.equal(
    auth.LoginRequestSchema.safeParse({
      credential: 'reader',
      password: '12345678',
    }).success,
    true,
  );
});

test('invalid and unknown configuration fails at construction rather than changing wire rules silently', () => {
  for (const mutate of [
    (c) => {
      c.login.password.required = 'true';
    },
    (c) => {
      c.login.password.minLength = -1;
    },
    (c) => {
      c.login.password.minLength = 1.5;
    },
    (c) => {
      c.login.password.minLength = 20;
      c.login.password.maxLength = 10;
    },
    (c) => {
      c.login.password.emptyStringPolicy = 'trim';
    },
    (c) => {
      c.login.extra = {};
    },
    (c) => {
      c.unknown = true;
    },
  ]) {
    const config = structuredClone(auth.DefaultAuthContractConfig);
    mutate(config);
    assert.throws(() => auth.createAuthContracts(config));
  }
});
