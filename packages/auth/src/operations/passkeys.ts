import { z } from 'zod';
import type { HttpOperationDefinition } from '../../../../tools/contract-authoring/operation-definition.js';
import {
  PasskeyAuthenticationBeginRequestSchema,
  PasskeyAuthenticationBeginResponseSchema,
  PasskeyAuthenticationFinishRequestSchema,
  PasskeyAuthenticationFinishResponseSchema,
  PasskeyRegistrationBeginRequestSchema,
  PasskeyRegistrationBeginResponseSchema,
  PasskeyRegistrationFinishRequestSchema,
  PasskeyRegistrationFinishResponseSchema,
} from '../schemas/index.js';
import {
  json,
  success,
  badRequest,
  unauthorized,
  forbidden,
  serverError,
  baselineRevision,
  normalization,
  cookies,
  policy,
  protection,
  passkeyVerification,
} from './support.js';
export const beginRegistration = {
  domain: 'auth',
  capability: 'auth.passkeys',
  operationId: 'beginRegistration',
  method: 'POST',
  path: '/auth/passkeys/registration/begin',
  tags: ['Auth'],
  summary: 'Begin passkey registration',
  description:
    'Registration is bound to the authenticated principal, never a body-supplied userId.',
  parameters: [],
  requestBody: json(PasskeyRegistrationBeginRequestSchema),
  responses: {
    '200': success(PasskeyRegistrationBeginResponseSchema, true),
    '400': badRequest,
    '401': unauthorized,
    '403': forbidden,
    '500': serverError,
  },
  security: { kind: 'profile', binding: 'auth.protected' },
  availability: { kind: 'capability', capability: 'auth.passkeys' },
  semantics: [
    normalization,
    cookies,
    protection,
    passkeyVerification,
    {
      id: 'auth.beginRegistration.outcome',
      phase: 'application outcome',
      description:
        'Registration is bound to the authenticated principal, never a body-supplied userId.',
      fixtures: [
        'passkey-guard-registration',
        'passkey-registration-begin',
        'passkey-registration-strips-user-id',
        'passkey-registration-invalid-attachment',
      ],
    },
  ],
  compatibility: {
    revision: baselineRevision,
    route: 'POST /auth/passkeys/registration/begin',
    fixtures: [
      'passkey-guard-registration',
      'passkey-registration-begin',
      'passkey-registration-strips-user-id',
      'passkey-registration-invalid-attachment',
    ],
    discrepancies: ['D03', 'D04'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const finishRegistration = {
  domain: 'auth',
  capability: 'auth.passkeys',
  operationId: 'finishRegistration',
  method: 'POST',
  path: '/auth/passkeys/registration/finish',
  tags: ['Auth'],
  summary: 'Finish passkey registration',
  description:
    'The verifier owns ceremony checks and credential persistence; parsing JSON is not verification.',
  parameters: [],
  requestBody: json(PasskeyRegistrationFinishRequestSchema),
  responses: {
    '200': success(PasskeyRegistrationFinishResponseSchema, true),
    '400': badRequest,
    '401': unauthorized,
    '403': forbidden,
    '500': serverError,
  },
  security: { kind: 'profile', binding: 'auth.protected' },
  availability: { kind: 'capability', capability: 'auth.passkeys' },
  semantics: [
    normalization,
    cookies,
    protection,
    passkeyVerification,
    {
      id: 'auth.finishRegistration.outcome',
      phase: 'application outcome',
      description:
        'The verifier owns ceremony checks and credential persistence; parsing JSON is not verification.',
      fixtures: [
        'passkey-registration-finish',
        'passkey-registration-missing-response',
      ],
    },
  ],
  compatibility: {
    revision: baselineRevision,
    route: 'POST /auth/passkeys/registration/finish',
    fixtures: [
      'passkey-registration-finish',
      'passkey-registration-missing-response',
    ],
    discrepancies: ['D03', 'D04'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const beginAuthentication = {
  domain: 'auth',
  capability: 'auth.passkeys',
  operationId: 'beginAuthentication',
  method: 'POST',
  path: '/auth/passkeys/authentication/begin',
  tags: ['Auth'],
  summary: 'Begin passkey authentication',
  description:
    'Public authentication initiation returns challenge options and any engine cookies.',
  parameters: [],
  requestBody: json(PasskeyAuthenticationBeginRequestSchema),
  responses: {
    '200': success(PasskeyAuthenticationBeginResponseSchema, true),
    '400': badRequest,
    '500': serverError,
  },
  security: { kind: 'public' },
  availability: { kind: 'capability', capability: 'auth.passkeys' },
  semantics: [
    normalization,
    cookies,
    passkeyVerification,
    {
      id: 'auth.beginAuthentication.outcome',
      phase: 'application outcome',
      description:
        'Public authentication initiation returns challenge options and any engine cookies.',
      fixtures: [
        'passkey-guard-public-authentication',
        'passkey-authentication-begin',
      ],
    },
  ],
  compatibility: {
    revision: baselineRevision,
    route: 'POST /auth/passkeys/authentication/begin',
    fixtures: [
      'passkey-guard-public-authentication',
      'passkey-authentication-begin',
    ],
    discrepancies: ['D03', 'D04'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const finishAuthentication = {
  domain: 'auth',
  capability: 'auth.passkeys',
  operationId: 'finishAuthentication',
  method: 'POST',
  path: '/auth/passkeys/authentication/finish',
  tags: ['Auth'],
  summary: 'Finish passkey authentication',
  description:
    'Rejected assertion returns 401; success returns session user/RBAC and engine cookies.',
  parameters: [],
  requestBody: json(PasskeyAuthenticationFinishRequestSchema),
  responses: {
    '200': success(PasskeyAuthenticationFinishResponseSchema, true),
    '400': badRequest,
    '401': unauthorized,
    '500': serverError,
  },
  security: { kind: 'public' },
  availability: { kind: 'capability', capability: 'auth.passkeys' },
  semantics: [
    normalization,
    cookies,
    policy,
    passkeyVerification,
    {
      id: 'auth.finishAuthentication.outcome',
      phase: 'application outcome',
      description:
        'Rejected assertion returns 401; success returns session user/RBAC and engine cookies.',
      fixtures: [
        'passkey-authentication-finish-null-handle',
        'passkey-authentication-verifier-rejects',
        'passkey-authentication-invalid-base64url',
      ],
    },
  ],
  compatibility: {
    revision: baselineRevision,
    route: 'POST /auth/passkeys/authentication/finish',
    fixtures: [
      'passkey-authentication-finish-null-handle',
      'passkey-authentication-verifier-rejects',
      'passkey-authentication-invalid-base64url',
    ],
    discrepancies: ['D03', 'D04'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const passkeysOperations = Object.freeze([
  beginRegistration,
  finishRegistration,
  beginAuthentication,
  finishAuthentication,
] as const);
