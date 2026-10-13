import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CreateUserProfileRequestSchema,
  UpdateUserProfileRequestSchema,
  UserProfileResponseSchema,
} from '@anarchitects/identity-contracts';

test('explicit null normalizes to empty string, but omission remains absent and mapper-owned fields are not silently stripped', () => {
  assert.deepEqual(
    CreateUserProfileRequestSchema.parse({
      authUserId: 123,
      displayName: null,
    }),
    { authUserId: '123', displayName: '' },
  );
  assert.deepEqual(UpdateUserProfileRequestSchema.parse({}), {});
  assert.deepEqual(
    UpdateUserProfileRequestSchema.parse({
      authUserId: 'attacker',
      displayName: null,
    }),
    { authUserId: 'attacker', displayName: '' },
  );
  // The implementation mapper, not the request validator, ignores authUserId.
});

test('serialized response requires nullable fields and never converts domain Date objects', () => {
  const wire = {
    id: 'p',
    authUserId: 'u',
    displayName: null,
    givenName: null,
    familyName: null,
    avatarUrl: null,
    locale: null,
    timeZone: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  assert.deepEqual(UserProfileResponseSchema.parse(wire), wire);
  assert.equal(
    UserProfileResponseSchema.safeParse({
      ...wire,
      createdAt: new Date(wire.createdAt),
    }).success,
    false,
  );
  delete wire.displayName;
  assert.equal(UserProfileResponseSchema.safeParse(wire).success, false);
});
