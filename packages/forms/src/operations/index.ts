import type { z } from 'zod';
import type {
  HttpOperationDefinition,
  ResponseDefinition,
  SemanticRequirement,
} from '../../../../tools/contract-authoring/operation-definition.js';
import {
  FormIdParamsSchema,
  FormDefinitionQuerySchema,
  SubmissionsQuerySchema,
  SubmissionIdParamsSchema,
  SubmissionRequestSchema,
  FormDefinitionEnvelopeResponseSchema,
  SubmissionResponseSchema,
  SubmissionsResponseSchema,
  BadRequestErrorSchema,
  UnauthorizedErrorSchema,
  ForbiddenErrorSchema,
  NotFoundErrorSchema,
  InternalServerErrorSchema,
} from '../schemas/index.js';

const json = <S extends z.ZodType>(schema: S) =>
  ({
    kind: 'json',
    required: true,
    content: { 'application/json': schema },
  }) as const;
const response = <S extends z.ZodType>(
  schema: S,
  outcome: 'success' | 'error',
  description: string,
) =>
  ({
    outcome,
    description,
    body: json(schema),
    headers: [],
    semantics: [],
  }) as const satisfies ResponseDefinition<z.ZodType>;
const errors = {
  '400': response(
    BadRequestErrorSchema,
    'error',
    'Malformed JSON or invalid route input; dynamic field validation is not enforced by the audited submit route.',
  ),
  '401': response(
    UnauthorizedErrorSchema,
    'error',
    'When the resolved host authentication binding rejects the request.',
  ),
  '403': response(
    ForbiddenErrorSchema,
    'error',
    'When the resolved resource authorization binding rejects the request.',
  ),
  '404': response(
    NotFoundErrorSchema,
    'error',
    'The form definition or submission was not found.',
  ),
  '500': response(
    InternalServerErrorSchema,
    'error',
    'Sanitized host failure; application/persistence/delivery failures are not transport validation errors.',
  ),
} as const;
const protection = {
  id: 'forms.host-protection',
  phase: 'authentication/authorization',
  description:
    'Require an approved host authentication and resource-authorization policy. Unguarded fixtures do not authorize anonymous access to definitions or submitted data.',
  fixtures: [],
} as const satisfies SemanticRequirement;
const coercion = {
  id: 'forms.transport-normalization',
  phase: 'normalization',
  description:
    'Preserve AJV scalar/singleton-array coercion, Unicode code-point lengths and unknown request/query fields. Validate integer versions >=1; never silently add pagination.',
  fixtures: [
    'forms-definition-query-coercion',
    'forms-submit-string-version',
    'forms-list-unknown-query',
  ],
} as const satisfies SemanticRequirement;
const security = { kind: 'profile', binding: 'forms.protected' } as const;
const revision = 'ecda1b6e0d9bc39c66373452a92dce91e06abee0';
const path = <S extends z.ZodType>(name: string, schema: S) =>
  ({
    in: 'path',
    name,
    required: true,
    schema,
    description: 'Existing route identifier.',
    serialization: { style: 'simple', explode: false },
  }) as const;
const query = <S extends z.ZodType>(
  name: string,
  schema: S,
  description: string,
) =>
  ({
    in: 'query',
    name,
    required: false,
    schema,
    description,
    serialization: { style: 'form', explode: true },
  }) as const;

export const getFormDefinition = {
  domain: 'forms',
  capability: 'forms.definitions',
  operationId: 'getFormDefinition',
  method: 'GET',
  path: '/forms/{formId}',
  tags: ['Forms'],
  summary: 'Read a form definition',
  description:
    'Return the config and its dynamic schema. Delivery-secret exposure blocks stable capability approval (D08).',
  parameters: [
    path('formId', FormIdParamsSchema.shape.formId),
    query(
      'formVersion',
      FormDefinitionQuerySchema.shape.formVersion,
      'Optional integer version; after validation the controller uses 1 when omitted.',
    ),
  ],
  requestBody: { kind: 'none' },
  responses: {
    '200': response(
      FormDefinitionEnvelopeResponseSchema,
      'success',
      'Config and dynamically derived schema.',
    ),
    ...errors,
  },
  security,
  availability: { kind: 'capability', capability: 'forms.definitions' },
  semantics: [
    protection,
    coercion,
    {
      id: 'forms.definition-default',
      phase: 'application outcome',
      description:
        'Only the definition controller defaults an omitted formVersion to 1. The query parser leaves it omitted.',
      fixtures: [
        'forms-definition-default-version',
        'forms-definition-query-coercion',
        'forms-definition-invalid-version',
      ],
    },
    {
      id: 'forms.delivery-exposure',
      phase: 'response',
      description:
        'D08 remains unresolved: the legacy config includes delivery metadata and webhook secrets. Preserve evidence but block stable definitions until architecture/security maintainers approve access scope or a separately versioned redaction.',
      fixtures: ['forms-definition-delivery-secret'],
    },
  ],
  compatibility: {
    revision,
    route: 'GET /forms/{formId}',
    fixtures: [
      'forms-definition-default-version',
      'forms-definition-query-coercion',
      'forms-definition-delivery-secret',
      'forms-definition-invalid-version',
      'forms-definition-missing',
    ],
    discrepancies: ['D03', 'D04', 'D06', 'D08'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const submitForm = {
  domain: 'forms',
  capability: 'forms.submissions',
  operationId: 'submitForm',
  method: 'POST',
  path: '/forms/submit',
  tags: ['Forms'],
  summary: 'Submit a form payload',
  description:
    'Preserve the audited envelope. Dynamic field validation is bypassed in the legacy implementation (D05); stable submission support remains blocked.',
  parameters: [],
  requestBody: json(SubmissionRequestSchema),
  responses: {
    '200': response(
      SubmissionResponseSchema,
      'success',
      'Serialized submission.',
    ),
    ...errors,
  },
  security,
  availability: { kind: 'capability', capability: 'forms.submissions' },
  semantics: [
    protection,
    coercion,
    {
      id: 'forms.dynamic-validation-bypass',
      phase: 'application outcome',
      description:
        'D05 remains unresolved: missing required dynamic fields, invalid email and extra payload fields reach persistence. Do not add dynamic validation in this transport extraction or advertise stable conformance; a fix needs a reviewed migration. Persistence and delivery stay application concerns.',
      fixtures: [
        'forms-submit-missing-required-dynamic-field',
        'forms-submit-invalid-dynamic-email',
        'forms-submit-unknown-payload-property',
      ],
    },
    {
      id: 'forms.required-submit-version',
      phase: 'normalization',
      description:
        'formVersion is required before application entry. The internal default does not make omission valid. A null/array payload fails; payload objects remain open.',
      fixtures: [
        'forms-submit-no-version',
        'forms-submit-null-payload',
        'forms-submit-string-version',
      ],
    },
  ],
  compatibility: {
    revision,
    route: 'POST /forms/submit',
    fixtures: [
      'forms-submit',
      'forms-submit-no-version',
      'forms-submit-string-version',
      'forms-submit-missing-required-dynamic-field',
      'forms-submit-invalid-dynamic-email',
      'forms-submit-unknown-payload-property',
      'forms-submit-null-payload',
      'forms-submit-malformed-json',
    ],
    discrepancies: ['D03', 'D04', 'D05', 'D06'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const getSubmissions = {
  domain: 'forms',
  capability: 'forms.submissions',
  operationId: 'getSubmissions',
  method: 'GET',
  path: '/forms/submissions',
  tags: ['Forms'],
  summary: 'List form submissions',
  description:
    'Return the existing array with optional formId/formVersion filters; no pagination contract is introduced.',
  parameters: [
    query(
      'formId',
      SubmissionsQuerySchema.shape.formId,
      'Optional nonempty form identifier.',
    ),
    query(
      'formVersion',
      SubmissionsQuerySchema.shape.formVersion,
      'Optional positive integer version.',
    ),
  ],
  requestBody: { kind: 'none' },
  responses: {
    '200': response(
      SubmissionsResponseSchema,
      'success',
      'Unpaginated submission array.',
    ),
    '400': errors[400],
    '401': errors[401],
    '403': errors[403],
    '500': errors[500],
  },
  security,
  availability: { kind: 'capability', capability: 'forms.submissions' },
  semantics: [
    protection,
    coercion,
    {
      id: 'forms.list-envelope',
      phase: 'response',
      description:
        'D10: preserve the array response and pass-through unknown query values. limit/offset acceptance is not a pagination guarantee.',
      fixtures: ['forms-list-filters', 'forms-list-unknown-query'],
    },
  ],
  compatibility: {
    revision,
    route: 'GET /forms/submissions',
    fixtures: ['forms-list-filters', 'forms-list-unknown-query'],
    discrepancies: ['D03', 'D04', 'D10'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const getSubmission = {
  domain: 'forms',
  capability: 'forms.submissions',
  operationId: 'getSubmission',
  method: 'GET',
  path: '/forms/submissions/{submissionId}',
  tags: ['Forms'],
  summary: 'Read a form submission',
  description:
    'Validate the legacy UUID grammar and return 404 when no submission exists.',
  parameters: [
    path('submissionId', SubmissionIdParamsSchema.shape.submissionId),
  ],
  requestBody: { kind: 'none' },
  responses: {
    '200': response(
      SubmissionResponseSchema,
      'success',
      'Serialized submission.',
    ),
    ...errors,
  },
  security,
  availability: { kind: 'capability', capability: 'forms.submissions' },
  semantics: [protection, coercion],
  compatibility: {
    revision,
    route: 'GET /forms/submissions/{submissionId}',
    fixtures: [
      'forms-detail',
      'forms-detail-missing',
      'forms-detail-invalid-uuid',
    ],
    discrepancies: ['D03', 'D04'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const formsOperations = Object.freeze([
  getFormDefinition,
  getSubmissions,
  getSubmission,
  submitForm,
] as const);
export type FormsOperation = (typeof formsOperations)[number];
export const formsProfiles = Object.freeze({
  protected: {
    capabilities: ['forms.definitions', 'forms.submissions'],
    protection: 'forms.protected',
    requiredBindings: [
      'authentication transport',
      'resource authorization policy',
    ],
    unresolved: true,
  },
} as const);
export const formsReleaseBlockers = Object.freeze([
  {
    id: 'D05',
    capability: 'forms.submissions',
    status: 'blocked',
    owner:
      'Contracts architecture maintainers and Bricks Forms/security maintainers',
    requirement:
      'Review dynamic-validation bypass and agree a versioned migration or constrained legacy disposition before stable support.',
  },
  {
    id: 'D08',
    capability: 'forms.definitions',
    status: 'blocked',
    owner:
      'Contracts architecture maintainers and Bricks Forms/security maintainers',
    requirement:
      'Review delivery-secret access scope and agree a versioned redaction or explicit constrained legacy disposition before stable support.',
  },
] as const);
