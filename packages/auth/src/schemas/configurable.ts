import { z } from 'zod';
import { decodedJson, stringInput, wireString } from './input.js';
import {
  AuthContractConfigSchema,
  freezeConfig,
  type AuthContractConfig,
  type AuthFieldConfig,
} from './config.js';

// Audited AJV email grammar, shared by default and configured requests.
const localAtom = "[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+";
const domainLabel = '[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?';
const emailPattern = new RegExp(
  `^${localAtom}(?:\\.${localAtom})*@(?:${domainLabel}\\.)+${domainLabel}$`,
);
export const authEmail = z.string().regex(emailPattern);
type RequiredField = ReturnType<typeof stringInput<z.ZodString>>;
type Field<F extends AuthFieldConfig> = F['required'] extends true
  ? RequiredField
  : F['required'] extends false
    ? z.ZodOptional<RequiredField>
    : RequiredField | z.ZodOptional<RequiredField>;

function field<F extends AuthFieldConfig>(config: F, email = false): Field<F> {
  let value =
    config.minLength !== undefined || config.maxLength !== undefined
      ? wireString(config.minLength ?? 0, config.maxLength)
      : z.string();
  if (email) value = value.regex(emailPattern);
  const schema = stringInput(value);
  // Required/optional is selected from the same literal used by the generic type.
  return (config.required ? schema : schema.optional()) as Field<F>;
}
const open = <T extends z.ZodRawShape>(shape: T) =>
  z.object(shape).catchall(decodedJson);

export function createAuthRequestSchemas<const C extends AuthContractConfig>(
  input: C,
) {
  // Parse to detach caller-owned objects. No defaulting, coercion or shaping here.
  const config = freezeConfig(
    AuthContractConfigSchema.parse(input),
  ) as Readonly<C>;
  return Object.freeze({
    config,
    registerRequestSchema: open({
      email: field<C['register']['email']>(config.register.email, true),
      password: field<C['register']['password']>(config.register.password),
      confirmPassword: field<C['register']['confirmPassword']>(
        config.register.confirmPassword,
      ),
      name: field<C['register']['name']>(config.register.name),
    }),
    loginRequestSchema: open({
      credential: field<C['login']['credential']>(config.login.credential),
      password: field<C['login']['password']>(config.login.password),
    }),
    forgotPasswordRequestSchema: open({
      email: field<C['forgotPassword']['email']>(
        config.forgotPassword.email,
        true,
      ),
    }),
    resetPasswordRequestSchema: open({
      token: field<C['resetPassword']['token']>(config.resetPassword.token),
      password: field<C['resetPassword']['password']>(
        config.resetPassword.password,
      ),
      confirmPassword: field<C['resetPassword']['confirmPassword']>(
        config.resetPassword.confirmPassword,
      ),
    }),
    verifyEmailRequestSchema: open({
      token: field<C['verifyEmail']['token']>(config.verifyEmail.token),
    }),
    changePasswordRequestSchema: open({
      currentPassword: field<C['changePassword']['currentPassword']>(
        config.changePassword.currentPassword,
      ),
      newPassword: field<C['changePassword']['newPassword']>(
        config.changePassword.newPassword,
      ),
      confirmPassword: field<C['changePassword']['confirmPassword']>(
        config.changePassword.confirmPassword,
      ),
    }),
    logoutRequestSchema: z.object({}),
  });
}
