import assert from 'node:assert/strict';
import { test } from 'node:test';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  FormDeliveryEmailSchema,
  FormDeliveryUriSchema,
  FormDefinitionResponseSchema,
  SubmissionResponseSchema,
} from '@anarchitects/forms-contracts';

test('delivery email and URI retain legacy formats without WHATWG normalization', () => {
  const ajv = new Ajv();
  addFormats(ajv);
  for (const [format, schema, values] of [
    [
      'email',
      FormDeliveryEmailSchema,
      [
        'reader@example.test',
        'A+B@EXAMPLE.C',
        'a@b.c',
        'a..b@c.test',
        'a@b',
        'a@b.c\n',
        ' x@y.z',
        '😀@a.b',
      ],
    ],
    [
      'uri',
      FormDeliveryUriSchema,
      [
        'https://example.test/hook',
        'HTTP://EXAMPLE.TEST/a?b=c#d',
        'mailto:reader@example.test',
        'urn:example:test',
        'http:',
        'http://',
        'https://[::1]:42/hook',
        'http://[v1.fe80]/',
        'http://[not-ip]/',
        'relative/path',
        'https://example.test/%GG',
        'https://é.example/',
        'https://example.test/a b',
        'https://example.test/\n',
        'data:text/plain,hello',
      ],
    ],
  ]) {
    const validate = ajv.compile({ type: 'string', format });
    for (const value of values)
      assert.equal(
        schema.safeParse(value).success,
        validate(value),
        `${format}: ${value}`,
      );
  }
});
test('response validation requires public field shapes and never performs projection, defaults or date serialization', () => {
  const config = {
    id: 'x',
    version: 1,
    fields: [{ name: 'x', kind: 'file', required: false, ui: { rows: 1 } }],
    security: { captcha: 'none' },
    validationRules: [
      { kind: 'matchFields', sourceField: 'a', targetField: 'b' },
    ],
  };
  assert.deepEqual(FormDefinitionResponseSchema.parse(config), config);
  assert.equal(
    FormDefinitionResponseSchema.safeParse({ ...config, security: {} }).success,
    false,
  );
  assert.equal(
    FormDefinitionResponseSchema.safeParse({ ...config, internal: true })
      .success,
    false,
  );
  const submission = {
    id: 'opaque-id',
    formId: 'x',
    formVersion: 1,
    payload: { nested: [null, true] },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  assert.deepEqual(SubmissionResponseSchema.parse(submission), submission);
  assert.equal(
    SubmissionResponseSchema.safeParse({ ...submission, createdAt: new Date() })
      .success,
    false,
  );
  assert.equal(
    SubmissionResponseSchema.safeParse({ ...submission, formVersion: '1' })
      .success,
    false,
  );
});
