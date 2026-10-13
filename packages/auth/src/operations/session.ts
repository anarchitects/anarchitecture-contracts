import { z } from 'zod';
import type { HttpOperationDefinition } from '../../../../tools/contract-authoring/operation-definition.js';
import {
  ActivateUserRequestSchema,
  ChangePasswordRequestSchema,
  ForgotPasswordRequestSchema,
  LoggedInUserInfoResponseSchema,
  LoginRequestSchema,
  LogoutRequestSchema,
  RegisterRequestSchema,
  RegisterResponseSchema,
  ResetPasswordRequestSchema,
  SuccessResponseSchema,
  UpdateEmailRequestSchema,
  UserIdParamsSchema,
  VerifyEmailRequestSchema,
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
} from './support.js';
export const registerUser = {
  domain: 'auth',
  capability: 'auth.session',
  operationId: 'registerUser',
  method: 'POST',
  path: '/auth/register',
  tags: ['Auth'],
  summary: 'Register a user',
  description:
    'Passwords must match; existing users fail with 400; successful registration returns success, not a session.',
  parameters: [],
  requestBody: json(RegisterRequestSchema),
  responses: {
    '200': success(RegisterResponseSchema, false),
    '400': badRequest,
    '500': serverError,
  },
  security: { kind: 'public' },
  availability: { kind: 'capability', capability: 'auth.session' },
  semantics: [
    normalization,
    {
      id: 'auth.registerUser.outcome',
      phase: 'application outcome',
      description:
        'Passwords must match; existing users fail with 400; successful registration returns success, not a session.',
      fixtures: [
        'auth-register',
        'auth-register-empty-optional-name',
        'auth-register-missing-password',
        'auth-register-short-password',
        'auth-register-mismatch',
        'auth-register-malformed-email',
        'auth-register-null-name',
        'auth-register-unknown-property',
        'auth-register-existing',
      ],
    },
  ],
  compatibility: {
    revision: baselineRevision,
    route: 'POST /auth/register',
    fixtures: [
      'auth-register',
      'auth-register-empty-optional-name',
      'auth-register-missing-password',
      'auth-register-short-password',
      'auth-register-mismatch',
      'auth-register-malformed-email',
      'auth-register-null-name',
      'auth-register-unknown-property',
      'auth-register-existing',
    ],
    discrepancies: ['D03', 'D04'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const activateUser = {
  domain: 'auth',
  capability: 'auth.session',
  operationId: 'activateUser',
  method: 'PATCH',
  path: '/auth/activate',
  tags: ['Auth'],
  summary: 'Activate a user',
  description:
    'Activation token verification belongs to the authentication service.',
  parameters: [],
  requestBody: json(ActivateUserRequestSchema),
  responses: {
    '200': success(SuccessResponseSchema, false),
    '400': badRequest,
    '500': serverError,
  },
  security: { kind: 'public' },
  availability: { kind: 'capability', capability: 'auth.session' },
  semantics: [
    normalization,
    {
      id: 'auth.activateUser.outcome',
      phase: 'application outcome',
      description:
        'Activation token verification belongs to the authentication service.',
      fixtures: ['auth-activate'],
    },
  ],
  compatibility: {
    revision: baselineRevision,
    route: 'PATCH /auth/activate',
    fixtures: ['auth-activate'],
    discrepancies: ['D03', 'D04'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const login = {
  domain: 'auth',
  capability: 'auth.session',
  operationId: 'login',
  method: 'POST',
  path: '/auth/login',
  tags: ['Auth'],
  summary: 'Start a session',
  description:
    'Rejected credentials return 401; success is a user/RBAC envelope, not JWT tokens.',
  parameters: [],
  requestBody: json(LoginRequestSchema),
  responses: {
    '200': success(LoggedInUserInfoResponseSchema, true),
    '400': badRequest,
    '401': unauthorized,
    '500': serverError,
  },
  security: { kind: 'public' },
  availability: { kind: 'capability', capability: 'auth.session' },
  semantics: [
    normalization,
    cookies,
    policy,
    {
      id: 'auth.login.outcome',
      phase: 'application outcome',
      description:
        'Rejected credentials return 401; success is a user/RBAC envelope, not JWT tokens.',
      fixtures: [
        'auth-login',
        'auth-login-engine-denial',
        'auth-login-policy-wire-order',
        'auth-login-number-coercion',
        'auth-login-short-password',
        'auth-guard-public-login',
      ],
    },
  ],
  compatibility: {
    revision: baselineRevision,
    route: 'POST /auth/login',
    fixtures: [
      'auth-login',
      'auth-login-engine-denial',
      'auth-login-policy-wire-order',
      'auth-login-number-coercion',
      'auth-login-short-password',
      'auth-guard-public-login',
    ],
    discrepancies: ['D03', 'D04', 'D07'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const logout = {
  domain: 'auth',
  capability: 'auth.session',
  operationId: 'logout',
  method: 'POST',
  path: '/auth/logout',
  tags: ['Auth'],
  summary: 'End a session',
  description: 'Forward the engine session invalidation and expiry cookies.',
  parameters: [],
  requestBody: json(LogoutRequestSchema),
  responses: {
    '200': success(SuccessResponseSchema, true),
    '400': badRequest,
    '401': unauthorized,
    '403': forbidden,
    '500': serverError,
  },
  security: { kind: 'profile', binding: 'auth.protected' },
  availability: { kind: 'capability', capability: 'auth.session' },
  semantics: [
    normalization,
    cookies,
    protection,
    {
      id: 'auth.logout.outcome',
      phase: 'application outcome',
      description:
        'Forward the engine session invalidation and expiry cookies.',
      fixtures: ['auth-logout', 'auth-logout-strips-unknown'],
    },
  ],
  compatibility: {
    revision: baselineRevision,
    route: 'POST /auth/logout',
    fixtures: ['auth-logout', 'auth-logout-strips-unknown'],
    discrepancies: ['D03', 'D04'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const changePassword = {
  domain: 'auth',
  capability: 'auth.session',
  operationId: 'changePassword',
  method: 'PATCH',
  path: '/auth/change-password/{userId}',
  tags: ['Auth'],
  summary: 'Change a password',
  description:
    'Wrong current password or confirmation mismatch returns 400; enforce the resolved host ownership policy.',
  parameters: [
    {
      in: 'path',
      name: 'userId',
      required: true,
      schema: UserIdParamsSchema.shape.userId,
      description: 'Target user identifier; ownership is enforced by the host.',
      serialization: { style: 'simple', explode: false },
    },
  ],
  requestBody: json(ChangePasswordRequestSchema),
  responses: {
    '200': success(SuccessResponseSchema, false),
    '400': badRequest,
    '401': unauthorized,
    '403': forbidden,
    '500': serverError,
  },
  security: { kind: 'profile', binding: 'auth.protected' },
  availability: { kind: 'capability', capability: 'auth.session' },
  semantics: [
    normalization,
    protection,
    {
      id: 'auth.changePassword.outcome',
      phase: 'application outcome',
      description:
        'Wrong current password or confirmation mismatch returns 400; enforce the resolved host ownership policy.',
      fixtures: ['auth-change-password', 'auth-change-wrong-password'],
    },
  ],
  compatibility: {
    revision: baselineRevision,
    route: 'PATCH /auth/change-password/{userId}',
    fixtures: ['auth-change-password', 'auth-change-wrong-password'],
    discrepancies: ['D03', 'D04'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const forgotPassword = {
  domain: 'auth',
  capability: 'auth.session',
  operationId: 'forgotPassword',
  method: 'POST',
  path: '/auth/forgot-password',
  tags: ['Auth'],
  summary: 'Request password recovery',
  description:
    'Recovery processing belongs to the engine; do not disclose provider internals in the response.',
  parameters: [],
  requestBody: json(ForgotPasswordRequestSchema),
  responses: {
    '200': success(SuccessResponseSchema, false),
    '400': badRequest,
    '500': serverError,
  },
  security: { kind: 'public' },
  availability: { kind: 'capability', capability: 'auth.session' },
  semantics: [
    normalization,
    {
      id: 'auth.forgotPassword.outcome',
      phase: 'application outcome',
      description:
        'Recovery processing belongs to the engine; do not disclose provider internals in the response.',
      fixtures: ['auth-forgot-password'],
    },
  ],
  compatibility: {
    revision: baselineRevision,
    route: 'POST /auth/forgot-password',
    fixtures: ['auth-forgot-password'],
    discrepancies: ['D03', 'D04'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const resetPassword = {
  domain: 'auth',
  capability: 'auth.session',
  operationId: 'resetPassword',
  method: 'POST',
  path: '/auth/reset-password',
  tags: ['Auth'],
  summary: 'Reset a password',
  description:
    'Password mismatch returns 400; rejected engine reset tokens map to 400 Invalid token.',
  parameters: [],
  requestBody: json(ResetPasswordRequestSchema),
  responses: {
    '200': success(SuccessResponseSchema, false),
    '400': badRequest,
    '500': serverError,
  },
  security: { kind: 'public' },
  availability: { kind: 'capability', capability: 'auth.session' },
  semantics: [
    normalization,
    {
      id: 'auth.resetPassword.outcome',
      phase: 'application outcome',
      description:
        'Password mismatch returns 400; rejected engine reset tokens map to 400 Invalid token.',
      fixtures: [
        'auth-reset-password',
        'auth-reset-mismatch',
        'auth-reset-invalid-token',
      ],
    },
  ],
  compatibility: {
    revision: baselineRevision,
    route: 'POST /auth/reset-password',
    fixtures: [
      'auth-reset-password',
      'auth-reset-mismatch',
      'auth-reset-invalid-token',
    ],
    discrepancies: ['D03', 'D04'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const verifyEmail = {
  domain: 'auth',
  capability: 'auth.session',
  operationId: 'verifyEmail',
  method: 'POST',
  path: '/auth/verify-email',
  tags: ['Auth'],
  summary: 'Verify an email address',
  description: 'Rejected engine verification tokens map to 400 Invalid token.',
  parameters: [],
  requestBody: json(VerifyEmailRequestSchema),
  responses: {
    '200': success(SuccessResponseSchema, false),
    '400': badRequest,
    '500': serverError,
  },
  security: { kind: 'public' },
  availability: { kind: 'capability', capability: 'auth.session' },
  semantics: [
    normalization,
    {
      id: 'auth.verifyEmail.outcome',
      phase: 'application outcome',
      description:
        'Rejected engine verification tokens map to 400 Invalid token.',
      fixtures: ['auth-verify-email', 'auth-verify-invalid-token'],
    },
  ],
  compatibility: {
    revision: baselineRevision,
    route: 'POST /auth/verify-email',
    fixtures: ['auth-verify-email', 'auth-verify-invalid-token'],
    discrepancies: ['D03', 'D04'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const updateEmail = {
  domain: 'auth',
  capability: 'auth.session',
  operationId: 'updateEmail',
  method: 'PATCH',
  path: '/auth/update-email/{userId}',
  tags: ['Auth'],
  summary: 'Update an email address',
  description:
    'Password is optional in the request contract; the application checks credentials and host authorization applies.',
  parameters: [
    {
      in: 'path',
      name: 'userId',
      required: true,
      schema: UserIdParamsSchema.shape.userId,
      description: 'Target user identifier; ownership is enforced by the host.',
      serialization: { style: 'simple', explode: false },
    },
  ],
  requestBody: json(UpdateEmailRequestSchema),
  responses: {
    '200': success(SuccessResponseSchema, false),
    '400': badRequest,
    '401': unauthorized,
    '403': forbidden,
    '500': serverError,
  },
  security: { kind: 'profile', binding: 'auth.protected' },
  availability: { kind: 'capability', capability: 'auth.session' },
  semantics: [
    normalization,
    protection,
    {
      id: 'auth.updateEmail.outcome',
      phase: 'application outcome',
      description:
        'Password is optional in the request contract; the application checks credentials and host authorization applies.',
      fixtures: ['auth-update-email'],
    },
  ],
  compatibility: {
    revision: baselineRevision,
    route: 'PATCH /auth/update-email/{userId}',
    fixtures: ['auth-update-email'],
    discrepancies: ['D03', 'D04'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const getLoggedInUserInfo = {
  domain: 'auth',
  capability: 'auth.session',
  operationId: 'getLoggedInUserInfo',
  method: 'GET',
  path: '/auth/me',
  tags: ['Auth'],
  summary: 'Read the active session',
  description:
    'Return user/RBAC only; this operation does not forward engine response headers.',
  parameters: [],
  requestBody: { kind: 'none' },
  responses: {
    '200': success(LoggedInUserInfoResponseSchema, false),
    '400': badRequest,
    '401': unauthorized,
    '403': forbidden,
    '500': serverError,
  },
  security: { kind: 'profile', binding: 'auth.protected' },
  availability: { kind: 'capability', capability: 'auth.session' },
  semantics: [
    policy,
    protection,
    {
      id: 'auth.getLoggedInUserInfo.outcome',
      phase: 'application outcome',
      description:
        'Return user/RBAC only; this operation does not forward engine response headers.',
      fixtures: [
        'auth-me',
        'auth-me-no-session-unguarded',
        'auth-me-no-session-guarded',
        'auth-guard-valid-session',
        'auth-guard-invalid-session',
      ],
    },
  ],
  compatibility: {
    revision: baselineRevision,
    route: 'GET /auth/me',
    fixtures: [
      'auth-me',
      'auth-me-no-session-unguarded',
      'auth-me-no-session-guarded',
      'auth-guard-valid-session',
      'auth-guard-invalid-session',
    ],
    discrepancies: ['D03', 'D04', 'D07'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const sessionOperations = Object.freeze([
  registerUser,
  activateUser,
  login,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  updateEmail,
  getLoggedInUserInfo,
] as const);
