import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildSync } from 'esbuild';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  createAuthContracts,
  DefaultAuthContractConfig,
} from '@anarchitects/auth-contracts';

const fixture = 'tools/contract-authoring/fixtures/auth-profile/';
const hashes = {
  'auth-contract.config.ts':
    '5e6133d73aa6a3dd9d2f0266251ad540205c657d545f8abd40a03dc78bb5a69a',
  'auth-contracts.factory.ts':
    '5059cc7928fae2703e03f91ecfbebe2fe822883499c09a7137a32d8c8baec389',
};
for (const [file, hash] of Object.entries(hashes))
  assert.equal(
    createHash('sha256')
      .update(readFileSync(fixture + file))
      .digest('hex'),
    hash,
    'Frozen Bricks oracle changed',
  );
async function oracle(file) {
  const { outputFiles } = buildSync({
    entryPoints: [fixture + file],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`
  );
}
const legacy = await oracle('auth-contracts.factory.ts');
const defaults = await oracle('auth-contract.config.ts');
const ajv = new Ajv({
  coerceTypes: 'array',
  useDefaults: true,
  removeAdditional: true,
  allErrors: false,
});
addFormats(ajv);
const groups = [
  'register',
  'login',
  'forgotPassword',
  'resetPassword',
  'verifyEmail',
  'changePassword',
];
const corpus = [
  undefined,
  null,
  false,
  true,
  0,
  123456,
  1e21,
  Infinity,
  -Infinity,
  '',
  'a',
  '1234',
  '12345678',
  'a@b.c',
  'reader@example.test',
  'a..b@example.test',
  '😀'.repeat(6),
  '😀'.repeat(101),
  '\n',
  'a\n',
  [],
  [null],
  [123456],
  ['12345678'],
  ['a', 'b'],
  {},
  { nested: true },
];

test('canonical defaults equal the frozen configurable Bricks profile', () => {
  assert.deepEqual(
    DefaultAuthContractConfig,
    defaults.DefaultAuthContractConfig,
  );
});

test('all configurable fields match the frozen factory and Fastify AJV acceptance and parsed values', () => {
  let comparisons = 0;
  for (const group of groups)
    for (const field of Object.keys(DefaultAuthContractConfig[group])) {
      for (const rule of [
        { required: true, minLength: 10, maxLength: 40 },
        { required: false, minLength: 3, maxLength: 100 },
        { required: false, minLength: 0, maxLength: 0 },
        { required: true, minLength: undefined, maxLength: undefined },
      ])
        for (const emptyStringPolicy of ['strip', 'reject', 'allow']) {
          const config = structuredClone(DefaultAuthContractConfig);
          config[group][field] = {
            ...config[group][field],
            ...rule,
            emptyStringPolicy,
          };
          const key = `${group}RequestSchema`;
          const validate = ajv.compile(legacy.createAuthContracts(config)[key]);
          const schema = createAuthContracts(config)[key];
          const seed = Object.fromEntries(
            Object.keys(config[group]).map((name) => [
              name,
              /email/i.test(name) ? 'reader@example.test' : 'long-password-123',
            ]),
          );
          for (const value of corpus) {
            const input = { ...seed, extra: { keep: [1, null, true] } };
            if (value === undefined) delete input[field];
            else input[field] = value;
            const expected = structuredClone(input);
            const valid = validate(expected);
            const actual = schema.safeParse(input);
            const label = `${group}.${field} ${JSON.stringify(rule)} ${emptyStringPolicy} ${JSON.stringify(input)}`;
            assert.equal(actual.success, valid, label);
            if (valid) assert.deepEqual(actual.data, expected, label);
            comparisons++;
          }
        }
    }
  console.log(
    `Compared ${comparisons} configured field cases against the frozen Bricks factory.`,
  );
});

test('configured logout preserves legacy stripping and ignores shaping metadata on the server', () => {
  const config = structuredClone(DefaultAuthContractConfig);
  config.login.password = { required: false, emptyStringPolicy: 'strip' };
  const contracts = createAuthContracts(config);
  assert.deepEqual(
    contracts.loginRequestSchema.parse({ credential: 'reader', password: '' }),
    { credential: 'reader', password: '' },
  );
  assert.deepEqual(
    contracts.logoutRequestSchema.parse({ extra: 'removed' }),
    {},
  );
});
