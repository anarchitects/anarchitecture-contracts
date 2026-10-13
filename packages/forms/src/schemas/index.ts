import { z } from 'zod';
export * from './forms.js';
import {
  FormIdParamsSchema,
  FormDefinitionQuerySchema,
  SubmissionsQuerySchema,
  SubmissionIdParamsSchema,
  SubmissionRequestSchema,
  FormFieldSchema,
  FormDefinitionResponseSchema,
  FormDefinitionEnvelopeResponseSchema,
  SubmissionResponseSchema,
  SubmissionsResponseSchema,
} from './forms.js';
export * from './formats.js';
import {
  FormDeliveryUriSchema,
  FormDeliveryEmailSchema,
  SubmissionIdSchema,
} from './formats.js';
export * from './errors.js';
import {
  ValidationErrorSchema,
  BadRequestErrorSchema,
  UnauthorizedErrorSchema,
  ForbiddenErrorSchema,
  NotFoundErrorSchema,
  InternalServerErrorSchema,
} from './errors.js';
export type FormIdParamsInput = z.input<typeof FormIdParamsSchema>;
export type FormIdParams = z.output<typeof FormIdParamsSchema>;
export type FormDefinitionQueryInput = z.input<
  typeof FormDefinitionQuerySchema
>;
export type FormDefinitionQuery = z.output<typeof FormDefinitionQuerySchema>;
export type SubmissionsQueryInput = z.input<typeof SubmissionsQuerySchema>;
export type SubmissionsQuery = z.output<typeof SubmissionsQuerySchema>;
export type SubmissionIdParamsInput = z.input<typeof SubmissionIdParamsSchema>;
export type SubmissionIdParams = z.output<typeof SubmissionIdParamsSchema>;
export type SubmissionRequestInput = z.input<typeof SubmissionRequestSchema>;
export type SubmissionRequest = z.output<typeof SubmissionRequestSchema>;
export type FormField = z.infer<typeof FormFieldSchema>;
export type FormDefinitionResponse = z.infer<
  typeof FormDefinitionResponseSchema
>;
export type FormDefinitionEnvelopeResponse = z.infer<
  typeof FormDefinitionEnvelopeResponseSchema
>;
export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;
export type SubmissionsResponse = z.infer<typeof SubmissionsResponseSchema>;
export type FormDeliveryUri = z.infer<typeof FormDeliveryUriSchema>;
export type FormDeliveryEmail = z.infer<typeof FormDeliveryEmailSchema>;
export type SubmissionId = z.infer<typeof SubmissionIdSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type BadRequestErrorInput = z.input<typeof BadRequestErrorSchema>;
export type BadRequestError = z.output<typeof BadRequestErrorSchema>;
export type UnauthorizedError = z.infer<typeof UnauthorizedErrorSchema>;
export type ForbiddenError = z.infer<typeof ForbiddenErrorSchema>;
export type NotFoundError = z.infer<typeof NotFoundErrorSchema>;
export type InternalServerError = z.infer<typeof InternalServerErrorSchema>;
export const formsSchemas = Object.freeze({
  'forms.FormIdParams': FormIdParamsSchema,
  'forms.FormDefinitionQuery': FormDefinitionQuerySchema,
  'forms.SubmissionsQuery': SubmissionsQuerySchema,
  'forms.SubmissionIdParams': SubmissionIdParamsSchema,
  'forms.SubmissionRequest': SubmissionRequestSchema,
  'forms.FormField': FormFieldSchema,
  'forms.FormDefinitionResponse': FormDefinitionResponseSchema,
  'forms.FormDefinitionEnvelopeResponse': FormDefinitionEnvelopeResponseSchema,
  'forms.SubmissionResponse': SubmissionResponseSchema,
  'forms.SubmissionsResponse': SubmissionsResponseSchema,
  'forms.FormDeliveryUri': FormDeliveryUriSchema,
  'forms.FormDeliveryEmail': FormDeliveryEmailSchema,
  'forms.SubmissionId': SubmissionIdSchema,
  'forms.ValidationError': ValidationErrorSchema,
  'forms.BadRequestError': BadRequestErrorSchema,
  'forms.UnauthorizedError': UnauthorizedErrorSchema,
  'forms.ForbiddenError': ForbiddenErrorSchema,
  'forms.NotFoundError': NotFoundErrorSchema,
  'forms.InternalServerError': InternalServerErrorSchema,
});
