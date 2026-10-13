import { z } from 'zod';
import type { HttpOperationDefinition } from '../../../../tools/contract-authoring/operation-definition.js';
import {
  JwtLoginRequestSchema,
  JwtLogoutRequestSchema,
  JwtRefreshRequestSchema,
  JwtTokensResponseSchema,
  SuccessResponseSchema,
} from '../schemas/index.js';
import {
  json,
  success,
  badRequest,
  serverError,
  baselineRevision,
  normalization,
} from './support.js';
export const loginWithJwt = {
  domain: 'auth',
  capability: 'auth.jwt',
  operationId: 'loginWithJwt',
  method: 'POST',
  path: '/auth/jwt/login',
  tags: ['Auth'],
  summary: 'Issue JWT tokens',
  description:
    'Verify credentials in the engine; invalid credentials return 400. No session cookies are promised.',
  parameters: [],
  requestBody: json(JwtLoginRequestSchema),
  responses: {
    '200': success(JwtTokensResponseSchema, false),
    '400': badRequest,
    '500': serverError,
  },
  security: { kind: 'public' },
  availability: { kind: 'capability', capability: 'auth.jwt' },
  semantics: [
    normalization,
    {
      id: 'auth.loginWithJwt.outcome',
      phase: 'application outcome',
      description:
        'Verify credentials in the engine; invalid credentials return 400. No session cookies are promised.',
      fixtures: ['jwt-login', 'jwt-invalid-password'],
    },
  ],
  compatibility: {
    revision: baselineRevision,
    route: 'POST /auth/jwt/login',
    fixtures: ['jwt-login', 'jwt-invalid-password'],
    discrepancies: ['D03', 'D04', 'D01'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const logoutWithJwt = {
  domain: 'auth',
  capability: 'auth.jwt',
  operationId: 'logoutWithJwt',
  method: 'POST',
  path: '/auth/jwt/logout',
  tags: ['Auth'],
  summary: 'Invalidate JWT tokens',
  description:
    'Verify the refresh token and invalidate tokens through the owning service; invalid token returns 400.',
  parameters: [],
  requestBody: json(JwtLogoutRequestSchema),
  responses: {
    '200': success(SuccessResponseSchema, false),
    '400': badRequest,
    '500': serverError,
  },
  security: { kind: 'public' },
  availability: { kind: 'capability', capability: 'auth.jwt' },
  semantics: [
    normalization,
    {
      id: 'auth.logoutWithJwt.outcome',
      phase: 'application outcome',
      description:
        'Verify the refresh token and invalidate tokens through the owning service; invalid token returns 400.',
      fixtures: ['jwt-logout-invalid-token', 'jwt-logout'],
    },
  ],
  compatibility: {
    revision: baselineRevision,
    route: 'POST /auth/jwt/logout',
    fixtures: ['jwt-logout-invalid-token', 'jwt-logout'],
    discrepancies: ['D03', 'D04', 'D01'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const refreshJwtTokens = {
  domain: 'auth',
  capability: 'auth.jwt',
  operationId: 'refreshJwtTokens',
  method: 'POST',
  path: '/auth/jwt/refresh',
  tags: ['Auth'],
  summary: 'Refresh JWT tokens',
  description:
    'Verify signature and invalidation state; invalid or invalidated refresh token returns 400.',
  parameters: [],
  requestBody: json(JwtRefreshRequestSchema),
  responses: {
    '200': success(JwtTokensResponseSchema, false),
    '400': badRequest,
    '500': serverError,
  },
  security: { kind: 'public' },
  availability: { kind: 'capability', capability: 'auth.jwt' },
  semantics: [
    normalization,
    {
      id: 'auth.refreshJwtTokens.outcome',
      phase: 'application outcome',
      description:
        'Verify signature and invalidation state; invalid or invalidated refresh token returns 400.',
      fixtures: [
        'jwt-refresh-invalid-token',
        'jwt-refresh',
        'jwt-refresh-invalidated',
      ],
    },
  ],
  compatibility: {
    revision: baselineRevision,
    route: 'POST /auth/jwt/refresh',
    fixtures: [
      'jwt-refresh-invalid-token',
      'jwt-refresh',
      'jwt-refresh-invalidated',
    ],
    discrepancies: ['D03', 'D04', 'D01'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const jwtOperations = Object.freeze([
  loginWithJwt,
  logoutWithJwt,
  refreshJwtTokens,
] as const);
