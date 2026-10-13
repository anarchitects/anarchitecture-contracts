import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PasskeyAuthenticationFinishRequestSchema,
  PasskeyRegistrationFinishRequestSchema,
} from '@anarchitects/auth-contracts/passkeys';
import { readFileSync } from 'node:fs';
const fixtures = JSON.parse(
  readFileSync(
    new URL('../../../baselines/legacy-3tier/http.json', import.meta.url),
  ),
);
const input = (id) =>
  structuredClone(fixtures.find((fixture) => fixture.id === id).steps[0].body);

test('passkey request parsing strips injected identity at each closed boundary and retains extension JSON', () => {
  const dto = input('passkey-registration-finish');
  dto.userId = 'attacker';
  dto.response.userId = 'attacker';
  dto.response.response.userId = 'attacker';
  dto.response.clientExtensionResults = { futureExtension: { enabled: true } };
  const parsed = PasskeyRegistrationFinishRequestSchema.parse(dto);
  assert.ok(!('userId' in parsed));
  assert.ok(!('userId' in parsed.response));
  assert.ok(!('userId' in parsed.response.response));
  assert.deepEqual(parsed.response.clientExtensionResults, {
    futureExtension: { enabled: true },
  });
});

test('assertion userHandle retains omission/null distinction and rejects padded base64url', () => {
  const dto = input('passkey-authentication-finish-null-handle');
  assert.equal(
    PasskeyAuthenticationFinishRequestSchema.parse(dto).response.response
      .userHandle,
    null,
  );
  delete dto.response.response.userHandle;
  assert.ok(
    !(
      'userHandle' in
      PasskeyAuthenticationFinishRequestSchema.parse(dto).response.response
    ),
  );
  dto.response.response.signature = 'padded=';
  assert.equal(
    PasskeyAuthenticationFinishRequestSchema.safeParse(dto).success,
    false,
  );
});
