import { z } from 'zod';
import type { HttpOperationDefinition } from '../../../tools/contract-authoring/operation-definition.js';
import { authSchemas, LoginRequestSchema } from './schemas/index.js';
import { authOperations } from './operations/index.js';
import { createAuthRequestSchemas } from './schemas/configurable.js';
import {
  DefaultAuthContractConfig,
  type AuthContractConfig,
} from './schemas/config.js';
export {
  AuthContractConfigSchema,
  AuthFieldConfigSchema,
  DefaultAuthContractConfig,
} from './schemas/config.js';
export type {
  AuthContractConfig,
  AuthFieldConfig,
  EmptyStringPolicy,
} from './schemas/config.js';

/** Configure session requests. JWT, passkeys and policy semantics remain unchanged. */
export type AuthContracts<C extends AuthContractConfig = AuthContractConfig> =
  ReturnType<typeof buildAuthContracts<C>>;
export function createAuthContracts(): AuthContracts<
  typeof DefaultAuthContractConfig
>;
export function createAuthContracts<const C extends AuthContractConfig>(
  config: C,
): AuthContracts<C>;
export function createAuthContracts(
  config: AuthContractConfig = DefaultAuthContractConfig,
) {
  return buildAuthContracts(config);
}

function buildAuthContracts<const C extends AuthContractConfig>(config: C) {
  const requests = createAuthRequestSchemas(config);
  const replacements = {
    registerUser: ['auth.RegisterRequest', requests.registerRequestSchema],
    login: ['auth.LoginRequest', requests.loginRequestSchema],
    logout: ['auth.LogoutRequest', requests.logoutRequestSchema],
    forgotPassword: [
      'auth.ForgotPasswordRequest',
      requests.forgotPasswordRequestSchema,
    ],
    resetPassword: [
      'auth.ResetPasswordRequest',
      requests.resetPasswordRequestSchema,
    ],
    verifyEmail: ['auth.VerifyEmailRequest', requests.verifyEmailRequestSchema],
    changePassword: [
      'auth.ChangePasswordRequest',
      requests.changePasswordRequestSchema,
    ],
  } as const;
  const schemas = Object.freeze({
    ...authSchemas,
    ...Object.fromEntries(Object.values(replacements)),
    // Legacy JWT login always used the fixed default, even for configured sessions.
    'auth.jwt.LoginRequest': LoginRequestSchema,
  });
  const operations: readonly HttpOperationDefinition<z.ZodType>[] =
    Object.freeze(
      authOperations.map((operation) => {
        const replacement =
          replacements[operation.operationId as keyof typeof replacements];
        return replacement
          ? {
              ...operation,
              requestBody: {
                kind: 'json' as const,
                required: true,
                content: { 'application/json': replacement[1] },
              },
            }
          : operation;
      }),
    );
  return Object.freeze({ ...requests, schemas, operations });
}
