import { z } from 'zod';
import { decodedJson, integerInput, stringInput, wireString } from './input.js';
import {
  FormDeliveryEmailSchema,
  FormDeliveryUriSchema,
  SubmissionIdSchema,
} from './formats.js';

const open = <T extends z.ZodRawShape>(shape: T) =>
  z.object(shape).catchall(decodedJson);
const version = integerInput.refine(
  (value) => value >= 1,
  'Expected version >= 1',
);
export const FormIdParamsSchema = open({ formId: stringInput(z.string()) });
// Omission is preserved by validation. The definition controller supplies 1.
export const FormDefinitionQuerySchema = open({
  formVersion: version.optional(),
});
export const SubmissionsQuerySchema = open({
  formId: stringInput(wireString(1)).optional(),
  formVersion: version.optional(),
});
export const SubmissionIdParamsSchema = open({
  submissionId: stringInput(SubmissionIdSchema),
});
export const SubmissionRequestSchema = open({
  formId: stringInput(z.string()),
  formVersion: version,
  // D05: legacy transport does not enforce the dynamic form field schema.
  payload: z.record(z.string(), decodedJson),
});

const integer = z.number().multipleOf(1);
export const FormFieldSchema = z.strictObject({
  name: z.string(),
  kind: z.enum([
    'string',
    'password',
    'email',
    'textarea',
    'boolean',
    'select',
    'file',
  ]),
  required: z.boolean().optional(),
  minLength: integer.min(0).optional(),
  maxLength: integer.min(0).optional(),
  pattern: z.string().optional(),
  options: z
    .array(z.strictObject({ value: z.string(), label: z.string() }))
    .optional(),
  ui: z
    .strictObject({
      label: z.string().optional(),
      placeholder: z.string().optional(),
      help: z.string().optional(),
      rows: integer.min(1).optional(),
    })
    .optional(),
});
export const FormDefinitionResponseSchema = z.strictObject({
  id: z.string(),
  version: integer.min(1),
  fields: z.array(FormFieldSchema),
  validationRules: z
    .array(
      z.strictObject({
        kind: z.literal('matchFields'),
        sourceField: z.string(),
        targetField: z.string(),
        message: z.string().optional(),
      }),
    )
    .optional(),
  security: z
    .strictObject({
      captcha: z.enum(['turnstile', 'hcaptcha', 'none']),
      honeypot: z.string().optional(),
    })
    .optional(),
  // D08: retaining the frozen response is not approval to disclose secrets.
  delivery: z
    .strictObject({
      adminEmail: FormDeliveryEmailSchema.optional(),
      templateId: z.string().optional(),
      subject: z.string().optional(),
      autoReply: z
        .strictObject({
          enabled: z.boolean(),
          templateId: z.string(),
          subject: z.string(),
        })
        .optional(),
      webhooks: z
        .array(
          z.strictObject({
            url: FormDeliveryUriSchema,
            secret: z.string().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});
export const FormDefinitionEnvelopeResponseSchema = z.strictObject({
  config: FormDefinitionResponseSchema,
  // This is the serialized, implementation-produced dynamic schema document.
  // Contracts does not compile it into domain validation rules or evaluate it.
  schema: z.json(),
});
export const SubmissionResponseSchema = z.strictObject({
  id: z.string(),
  formId: z.string(),
  formVersion: integer.min(1),
  payload: z.record(z.string(), z.json()),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
export const SubmissionsResponseSchema = z.array(SubmissionResponseSchema);
