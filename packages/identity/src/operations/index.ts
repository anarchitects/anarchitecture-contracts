import { z } from 'zod';
import type {
  HttpOperationDefinition,
  ResponseDefinition,
} from '../../../../tools/contract-authoring/operation-definition.js';
import {
  CreateUserProfileRequestSchema,
  UpdateUserProfileRequestSchema,
  ProfileIdSchema,
  UserProfileResponseSchema,
  BadRequestErrorSchema,
  UnauthorizedErrorSchema,
  ForbiddenErrorSchema,
  NotFoundErrorSchema,
  InternalServerErrorSchema,
} from '../schemas/index.js';
const json = <T extends z.ZodType>(schema: T) =>
  ({
    kind: 'json',
    required: true,
    content: { 'application/json': schema },
  }) as const;
const result = <T extends z.ZodType>(
  schema: T,
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
export const createUserProfile = {
  domain: 'identity',
  capability: 'identity.profiles',
  operationId: 'createUserProfile',
  method: 'POST',
  path: '/identity/profiles',
  tags: ['Identity'],
  summary: 'Create a profile',
  description:
    'Preserve profile transport independently of Auth domain models; protection is a required host binding.',
  parameters: [],
  requestBody: json(CreateUserProfileRequestSchema),
  responses: {
    '200': result(
      UserProfileResponseSchema,
      'success',
      'Profile with required nullable fields and serialized date-time strings.',
    ),
    '400': result(
      BadRequestErrorSchema,
      'error',
      'Invalid input or duplicate profile.',
    ),
    '401': result(
      UnauthorizedErrorSchema,
      'error',
      'When the host authentication binding rejects the request.',
    ),
    '403': result(
      ForbiddenErrorSchema,
      'error',
      'When the host resource authorization binding denies the request.',
    ),
    '500': result(
      InternalServerErrorSchema,
      'error',
      'Sanitized host failure.',
    ),
  },
  security: { kind: 'profile', binding: 'identity.protected' },
  availability: { kind: 'capability', capability: 'identity.profiles' },
  semantics: [
    {
      id: 'identity.host-protection',
      phase: 'authentication/authorization',
      description:
        'Resolve authentication and resource authorization before a deployment conformance claim. Unguarded fixture success is not permission for anonymous profile access.',
      fixtures: [],
    },
    {
      id: 'identity.request-normalization',
      phase: 'normalization',
      description:
        'Primitive/single-item-array values coerce to strings; explicit null becomes empty string, while omitted mutable fields remain omitted. Unknown keys survive validation; application mapping ignores them and cannot transfer authUserId on PATCH.',
      fixtures: [
        'identity-create-number-coercion',
        'identity-patch-null',
        'identity-patch-empty',
        'identity-patch-owner-ignored',
      ],
    },
    {
      id: 'identity.response-projection',
      phase: 'response',
      description:
        'The application maps only public fields, emits required nullable fields and serializes timestamps. Schema validation does not perform mapping or persistence.',
      fixtures: ['identity-create', 'identity-response-drops-extra'],
    },
  ],
  compatibility: {
    revision: 'ecda1b6e0d9bc39c66373452a92dce91e06abee0',
    route: 'POST /identity/profiles',
    fixtures: [
      'identity-create',
      'identity-response-drops-extra',
      'identity-create-nullable',
      'identity-create-number-coercion',
      'identity-create-extra-fields',
      'identity-create-duplicate',
      'identity-create-missing-owner',
    ],
    discrepancies: ['D03', 'D04', 'D11'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const getUserProfileById = {
  domain: 'identity',
  capability: 'identity.profiles',
  operationId: 'getUserProfileById',
  method: 'GET',
  path: '/identity/profiles/{profileId}',
  tags: ['Identity'],
  summary: 'Read a profile',
  description:
    'Preserve profile transport independently of Auth domain models; protection is a required host binding.',
  parameters: [
    {
      in: 'path',
      name: 'profileId',
      required: true,
      schema: ProfileIdSchema,
      description: 'Non-whitespace profile or auth-user identifier.',
      serialization: { style: 'simple', explode: false },
    },
  ],
  requestBody: { kind: 'none' },
  responses: {
    '200': result(
      UserProfileResponseSchema,
      'success',
      'Profile with required nullable fields and serialized date-time strings.',
    ),
    '400': result(
      BadRequestErrorSchema,
      'error',
      'Invalid input or duplicate profile.',
    ),
    '401': result(
      UnauthorizedErrorSchema,
      'error',
      'When the host authentication binding rejects the request.',
    ),
    '403': result(
      ForbiddenErrorSchema,
      'error',
      'When the host resource authorization binding denies the request.',
    ),
    '500': result(
      InternalServerErrorSchema,
      'error',
      'Sanitized host failure.',
    ),
    '404': result(NotFoundErrorSchema, 'error', 'Profile not found.'),
  },
  security: { kind: 'profile', binding: 'identity.protected' },
  availability: { kind: 'capability', capability: 'identity.profiles' },
  semantics: [
    {
      id: 'identity.host-protection',
      phase: 'authentication/authorization',
      description:
        'Resolve authentication and resource authorization before a deployment conformance claim. Unguarded fixture success is not permission for anonymous profile access.',
      fixtures: [],
    },
    {
      id: 'identity.request-normalization',
      phase: 'normalization',
      description:
        'Primitive/single-item-array values coerce to strings; explicit null becomes empty string, while omitted mutable fields remain omitted. Unknown keys survive validation; application mapping ignores them and cannot transfer authUserId on PATCH.',
      fixtures: [
        'identity-create-number-coercion',
        'identity-patch-null',
        'identity-patch-empty',
        'identity-patch-owner-ignored',
      ],
    },
    {
      id: 'identity.response-projection',
      phase: 'response',
      description:
        'The application maps only public fields, emits required nullable fields and serializes timestamps. Schema validation does not perform mapping or persistence.',
      fixtures: ['identity-create', 'identity-response-drops-extra'],
    },
  ],
  compatibility: {
    revision: 'ecda1b6e0d9bc39c66373452a92dce91e06abee0',
    route: 'GET /identity/profiles/{profileId}',
    fixtures: [
      'identity-get-by-id',
      'identity-get-missing',
      'identity-invalid-param',
    ],
    discrepancies: ['D03', 'D04', 'D11'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const getUserProfileByAuthUserId = {
  domain: 'identity',
  capability: 'identity.profiles',
  operationId: 'getUserProfileByAuthUserId',
  method: 'GET',
  path: '/identity/profiles/by-auth-user/{authUserId}',
  tags: ['Identity'],
  summary: 'Find a profile by auth user',
  description:
    'Preserve profile transport independently of Auth domain models; protection is a required host binding.',
  parameters: [
    {
      in: 'path',
      name: 'authUserId',
      required: true,
      schema: ProfileIdSchema,
      description: 'Non-whitespace profile or auth-user identifier.',
      serialization: { style: 'simple', explode: false },
    },
  ],
  requestBody: { kind: 'none' },
  responses: {
    '200': result(
      UserProfileResponseSchema,
      'success',
      'Profile with required nullable fields and serialized date-time strings.',
    ),
    '400': result(
      BadRequestErrorSchema,
      'error',
      'Invalid input or duplicate profile.',
    ),
    '401': result(
      UnauthorizedErrorSchema,
      'error',
      'When the host authentication binding rejects the request.',
    ),
    '403': result(
      ForbiddenErrorSchema,
      'error',
      'When the host resource authorization binding denies the request.',
    ),
    '500': result(
      InternalServerErrorSchema,
      'error',
      'Sanitized host failure.',
    ),
    '404': result(NotFoundErrorSchema, 'error', 'Profile not found.'),
  },
  security: { kind: 'profile', binding: 'identity.protected' },
  availability: { kind: 'capability', capability: 'identity.profiles' },
  semantics: [
    {
      id: 'identity.host-protection',
      phase: 'authentication/authorization',
      description:
        'Resolve authentication and resource authorization before a deployment conformance claim. Unguarded fixture success is not permission for anonymous profile access.',
      fixtures: [],
    },
    {
      id: 'identity.request-normalization',
      phase: 'normalization',
      description:
        'Primitive/single-item-array values coerce to strings; explicit null becomes empty string, while omitted mutable fields remain omitted. Unknown keys survive validation; application mapping ignores them and cannot transfer authUserId on PATCH.',
      fixtures: [
        'identity-create-number-coercion',
        'identity-patch-null',
        'identity-patch-empty',
        'identity-patch-owner-ignored',
      ],
    },
    {
      id: 'identity.response-projection',
      phase: 'response',
      description:
        'The application maps only public fields, emits required nullable fields and serializes timestamps. Schema validation does not perform mapping or persistence.',
      fixtures: ['identity-create', 'identity-response-drops-extra'],
    },
  ],
  compatibility: {
    revision: 'ecda1b6e0d9bc39c66373452a92dce91e06abee0',
    route: 'GET /identity/profiles/by-auth-user/{authUserId}',
    fixtures: ['identity-get-by-auth-user'],
    discrepancies: ['D03', 'D04', 'D11'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const updateUserProfile = {
  domain: 'identity',
  capability: 'identity.profiles',
  operationId: 'updateUserProfile',
  method: 'PATCH',
  path: '/identity/profiles/{profileId}',
  tags: ['Identity'],
  summary: 'Update mutable profile fields',
  description:
    'Preserve profile transport independently of Auth domain models; protection is a required host binding.',
  parameters: [
    {
      in: 'path',
      name: 'profileId',
      required: true,
      schema: ProfileIdSchema,
      description: 'Non-whitespace profile or auth-user identifier.',
      serialization: { style: 'simple', explode: false },
    },
  ],
  requestBody: json(UpdateUserProfileRequestSchema),
  responses: {
    '200': result(
      UserProfileResponseSchema,
      'success',
      'Profile with required nullable fields and serialized date-time strings.',
    ),
    '400': result(
      BadRequestErrorSchema,
      'error',
      'Invalid input or duplicate profile.',
    ),
    '401': result(
      UnauthorizedErrorSchema,
      'error',
      'When the host authentication binding rejects the request.',
    ),
    '403': result(
      ForbiddenErrorSchema,
      'error',
      'When the host resource authorization binding denies the request.',
    ),
    '500': result(
      InternalServerErrorSchema,
      'error',
      'Sanitized host failure.',
    ),
    '404': result(NotFoundErrorSchema, 'error', 'Profile not found.'),
  },
  security: { kind: 'profile', binding: 'identity.protected' },
  availability: { kind: 'capability', capability: 'identity.profiles' },
  semantics: [
    {
      id: 'identity.host-protection',
      phase: 'authentication/authorization',
      description:
        'Resolve authentication and resource authorization before a deployment conformance claim. Unguarded fixture success is not permission for anonymous profile access.',
      fixtures: [],
    },
    {
      id: 'identity.request-normalization',
      phase: 'normalization',
      description:
        'Primitive/single-item-array values coerce to strings; explicit null becomes empty string, while omitted mutable fields remain omitted. Unknown keys survive validation; application mapping ignores them and cannot transfer authUserId on PATCH.',
      fixtures: [
        'identity-create-number-coercion',
        'identity-patch-null',
        'identity-patch-empty',
        'identity-patch-owner-ignored',
      ],
    },
    {
      id: 'identity.response-projection',
      phase: 'response',
      description:
        'The application maps only public fields, emits required nullable fields and serializes timestamps. Schema validation does not perform mapping or persistence.',
      fixtures: ['identity-create', 'identity-response-drops-extra'],
    },
  ],
  compatibility: {
    revision: 'ecda1b6e0d9bc39c66373452a92dce91e06abee0',
    route: 'PATCH /identity/profiles/{profileId}',
    fixtures: [
      'identity-patch-null',
      'identity-patch-empty',
      'identity-patch-owner-ignored',
      'identity-patch-invalid-shape',
      'identity-patch-missing',
    ],
    discrepancies: ['D03', 'D04', 'D11'],
    migrations: [],
  },
  deprecated: false,
} as const satisfies HttpOperationDefinition<z.ZodType>;

export const identityOperations = Object.freeze([
  createUserProfile,
  getUserProfileById,
  getUserProfileByAuthUserId,
  updateUserProfile,
] as const);
export type IdentityOperation = (typeof identityOperations)[number];
export const identityProfiles = Object.freeze({
  protected: {
    capabilities: ['identity.profiles'],
    protection: 'identity.protected',
    requiredBindings: [
      'authentication transport',
      'resource authorization policy',
    ],
    unresolved: true,
  },
} as const);
