import { z } from 'zod';
export * from './session.js';
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  LogoutRequestSchema,
  ActivateUserRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
  VerifyEmailRequestSchema,
  ChangePasswordRequestSchema,
  UpdateEmailRequestSchema,
  UserIdParamsSchema,
  SuccessResponseSchema,
  RegisterResponseSchema,
  LoggedInUserInfoResponseSchema,
  SetCookieHeaderSchema,
  ValidationErrorSchema,
  BadRequestErrorSchema,
  UnauthorizedErrorSchema,
  ForbiddenErrorSchema,
  NotFoundErrorSchema,
  InternalServerErrorSchema,
} from './session.js';
export * from './policy.js';
import { PolicyRuleSchema, PolicyRuleArraySchema } from './policy.js';
export * from './jwt.js';
import {
  JwtRefreshRequestSchema,
  JwtLogoutRequestSchema,
  JwtTokensResponseSchema,
} from './jwt.js';
export * from './passkeys.js';
import {
  PasskeyBase64UrlSchema,
  PasskeyRegistrationCredentialSchema,
  PasskeyAuthenticationCredentialSchema,
  PasskeyRegistrationBeginRequestSchema,
  PasskeyRegistrationFinishRequestSchema,
  PasskeyAuthenticationBeginRequestSchema,
  PasskeyAuthenticationFinishRequestSchema,
  PasskeyRegistrationBeginResponseSchema,
  PasskeyAuthenticationBeginResponseSchema,
} from './passkeys.js';
export type RegisterRequestInput = z.input<typeof RegisterRequestSchema>;
export type RegisterRequest = z.output<typeof RegisterRequestSchema>;
export type LoginRequestInput = z.input<typeof LoginRequestSchema>;
export type LoginRequest = z.output<typeof LoginRequestSchema>;
export type LogoutRequestInput = z.input<typeof LogoutRequestSchema>;
export type LogoutRequest = z.output<typeof LogoutRequestSchema>;
export type ActivateUserRequestInput = z.input<
  typeof ActivateUserRequestSchema
>;
export type ActivateUserRequest = z.output<typeof ActivateUserRequestSchema>;
export type ForgotPasswordRequestInput = z.input<
  typeof ForgotPasswordRequestSchema
>;
export type ForgotPasswordRequest = z.output<
  typeof ForgotPasswordRequestSchema
>;
export type ResetPasswordRequestInput = z.input<
  typeof ResetPasswordRequestSchema
>;
export type ResetPasswordRequest = z.output<typeof ResetPasswordRequestSchema>;
export type VerifyEmailRequestInput = z.input<typeof VerifyEmailRequestSchema>;
export type VerifyEmailRequest = z.output<typeof VerifyEmailRequestSchema>;
export type ChangePasswordRequestInput = z.input<
  typeof ChangePasswordRequestSchema
>;
export type ChangePasswordRequest = z.output<
  typeof ChangePasswordRequestSchema
>;
export type UpdateEmailRequestInput = z.input<typeof UpdateEmailRequestSchema>;
export type UpdateEmailRequest = z.output<typeof UpdateEmailRequestSchema>;
export type UserIdParamsInput = z.input<typeof UserIdParamsSchema>;
export type UserIdParams = z.output<typeof UserIdParamsSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type LoggedInUserInfoResponse = z.infer<
  typeof LoggedInUserInfoResponseSchema
>;
export type SetCookieHeader = z.infer<typeof SetCookieHeaderSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type BadRequestErrorInput = z.input<typeof BadRequestErrorSchema>;
export type BadRequestError = z.output<typeof BadRequestErrorSchema>;
export type UnauthorizedError = z.infer<typeof UnauthorizedErrorSchema>;
export type ForbiddenError = z.infer<typeof ForbiddenErrorSchema>;
export type NotFoundError = z.infer<typeof NotFoundErrorSchema>;
export type InternalServerError = z.infer<typeof InternalServerErrorSchema>;
export type JwtRefreshRequestInput = z.input<typeof JwtRefreshRequestSchema>;
export type JwtRefreshRequest = z.output<typeof JwtRefreshRequestSchema>;
export type JwtLogoutRequestInput = z.input<typeof JwtLogoutRequestSchema>;
export type JwtLogoutRequest = z.output<typeof JwtLogoutRequestSchema>;
export type JwtTokensResponse = z.infer<typeof JwtTokensResponseSchema>;
export type PasskeyBase64Url = z.infer<typeof PasskeyBase64UrlSchema>;
export type PasskeyRegistrationCredentialInput = z.input<
  typeof PasskeyRegistrationCredentialSchema
>;
export type PasskeyRegistrationCredential = z.output<
  typeof PasskeyRegistrationCredentialSchema
>;
export type PasskeyAuthenticationCredentialInput = z.input<
  typeof PasskeyAuthenticationCredentialSchema
>;
export type PasskeyAuthenticationCredential = z.output<
  typeof PasskeyAuthenticationCredentialSchema
>;
export type PasskeyRegistrationBeginRequestInput = z.input<
  typeof PasskeyRegistrationBeginRequestSchema
>;
export type PasskeyRegistrationBeginRequest = z.output<
  typeof PasskeyRegistrationBeginRequestSchema
>;
export type PasskeyRegistrationFinishRequestInput = z.input<
  typeof PasskeyRegistrationFinishRequestSchema
>;
export type PasskeyRegistrationFinishRequest = z.output<
  typeof PasskeyRegistrationFinishRequestSchema
>;
export type PasskeyAuthenticationBeginRequestInput = z.input<
  typeof PasskeyAuthenticationBeginRequestSchema
>;
export type PasskeyAuthenticationBeginRequest = z.output<
  typeof PasskeyAuthenticationBeginRequestSchema
>;
export type PasskeyAuthenticationFinishRequestInput = z.input<
  typeof PasskeyAuthenticationFinishRequestSchema
>;
export type PasskeyAuthenticationFinishRequest = z.output<
  typeof PasskeyAuthenticationFinishRequestSchema
>;
export type PasskeyRegistrationBeginResponse = z.infer<
  typeof PasskeyRegistrationBeginResponseSchema
>;
export type PasskeyAuthenticationBeginResponse = z.infer<
  typeof PasskeyAuthenticationBeginResponseSchema
>;
export type JwtLoginRequestInput = z.input<typeof LoginRequestSchema>;
export type JwtLoginRequest = z.output<typeof LoginRequestSchema>;
export type PasskeyAuthenticationFinishResponse = z.infer<
  typeof LoggedInUserInfoResponseSchema
>;
export type PasskeyRegistrationFinishResponse = z.infer<
  typeof SuccessResponseSchema
>;
export const authSchemas = Object.freeze({
  'auth.RegisterRequest': RegisterRequestSchema,
  'auth.LoginRequest': LoginRequestSchema,
  'auth.LogoutRequest': LogoutRequestSchema,
  'auth.ActivateUserRequest': ActivateUserRequestSchema,
  'auth.ForgotPasswordRequest': ForgotPasswordRequestSchema,
  'auth.ResetPasswordRequest': ResetPasswordRequestSchema,
  'auth.VerifyEmailRequest': VerifyEmailRequestSchema,
  'auth.ChangePasswordRequest': ChangePasswordRequestSchema,
  'auth.UpdateEmailRequest': UpdateEmailRequestSchema,
  'auth.UserIdParams': UserIdParamsSchema,
  'auth.SuccessResponse': SuccessResponseSchema,
  'auth.LoggedInUserInfoResponse': LoggedInUserInfoResponseSchema,
  'auth.SetCookieHeader': SetCookieHeaderSchema,
  'auth.ValidationError': ValidationErrorSchema,
  'auth.BadRequestError': BadRequestErrorSchema,
  'auth.UnauthorizedError': UnauthorizedErrorSchema,
  'auth.ForbiddenError': ForbiddenErrorSchema,
  'auth.NotFoundError': NotFoundErrorSchema,
  'auth.InternalServerError': InternalServerErrorSchema,
  'auth.policy.PolicyRule': PolicyRuleSchema,
  'auth.policy.PolicyRuleArray': PolicyRuleArraySchema,
  'auth.jwt.JwtRefreshRequest': JwtRefreshRequestSchema,
  'auth.jwt.JwtLogoutRequest': JwtLogoutRequestSchema,
  'auth.jwt.JwtTokensResponse': JwtTokensResponseSchema,
  'auth.passkeys.PasskeyBase64Url': PasskeyBase64UrlSchema,
  'auth.passkeys.PasskeyRegistrationCredential':
    PasskeyRegistrationCredentialSchema,
  'auth.passkeys.PasskeyAuthenticationCredential':
    PasskeyAuthenticationCredentialSchema,
  'auth.passkeys.PasskeyRegistrationBeginRequest':
    PasskeyRegistrationBeginRequestSchema,
  'auth.passkeys.PasskeyRegistrationFinishRequest':
    PasskeyRegistrationFinishRequestSchema,
  'auth.passkeys.PasskeyAuthenticationBeginRequest':
    PasskeyAuthenticationBeginRequestSchema,
  'auth.passkeys.PasskeyAuthenticationFinishRequest':
    PasskeyAuthenticationFinishRequestSchema,
  'auth.passkeys.PasskeyRegistrationBeginResponse':
    PasskeyRegistrationBeginResponseSchema,
  'auth.passkeys.PasskeyAuthenticationBeginResponse':
    PasskeyAuthenticationBeginResponseSchema,
});
