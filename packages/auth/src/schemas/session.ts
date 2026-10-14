import { z } from 'zod';
import { decodedJson, stringInput, wireString } from './input.js';
import { PolicyRuleArraySchema } from './policy.js';

import {
  createAuthRequestSchemas,
  authEmail as email,
} from './configurable.js';
import { DefaultAuthContractConfig } from './config.js';

const defaults = createAuthRequestSchemas(DefaultAuthContractConfig);
const password = stringInput(wireString(6));
const token = stringInput(wireString(1));
const open = <T extends z.ZodRawShape>(shape: T) =>
  z.object(shape).catchall(decodedJson);
export const RegisterRequestSchema = defaults.registerRequestSchema;
export const LoginRequestSchema = defaults.loginRequestSchema;
export const LogoutRequestSchema = defaults.logoutRequestSchema;
export const ActivateUserRequestSchema = open({ token });
export const ForgotPasswordRequestSchema = defaults.forgotPasswordRequestSchema;
export const ResetPasswordRequestSchema = defaults.resetPasswordRequestSchema;
export const VerifyEmailRequestSchema = defaults.verifyEmailRequestSchema;
export const ChangePasswordRequestSchema = defaults.changePasswordRequestSchema;
export const UpdateEmailRequestSchema = open({
  newEmail: stringInput(email),
  password: password.optional(),
});
export const UserIdParamsSchema = open({ userId: stringInput(z.string()) });
export const SuccessResponseSchema = z.strictObject({ success: z.boolean() });
export const RegisterResponseSchema = SuccessResponseSchema;
export const LoggedInUserInfoResponseSchema = z.strictObject({
  user: z.json(),
  rbac: PolicyRuleArraySchema,
});
export const SetCookieHeaderSchema = z.string();

// Error envelopes describe existing transport, never expose Zod issues directly.
export const ValidationErrorSchema = z.strictObject({
  statusCode: z.literal(400),
  message: z.string(),
});
const exception = <C extends number>(status: C) =>
  z.strictObject({
    statusCode: z.literal(status),
    message: z.string(),
    error: z.string(),
  });
export const BadRequestErrorSchema = z.union([
  ValidationErrorSchema,
  exception(400),
]);
export const UnauthorizedErrorSchema = exception(401);
export const ForbiddenErrorSchema = exception(403);
export const NotFoundErrorSchema = exception(404);
export const InternalServerErrorSchema = exception(500);
