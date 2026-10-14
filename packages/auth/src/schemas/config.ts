import { z } from 'zod';

// Payload shaping metadata is intentionally not executed by server schemas.
export const AuthFieldConfigSchema = z
  .strictObject({
    required: z.boolean(),
    minLength: z.number().int().nonnegative().optional(),
    maxLength: z.number().int().nonnegative().optional(),
    emptyStringPolicy: z.enum(['strip', 'reject', 'allow']),
  })
  .refine(
    (field) =>
      field.minLength === undefined ||
      field.maxLength === undefined ||
      field.minLength <= field.maxLength,
    'minLength must not exceed maxLength',
  );
const fields = <T extends z.ZodRawShape>(shape: T) => z.strictObject(shape);
export const AuthContractConfigSchema = fields({
  version: z.union([z.string(), z.number()]),
  register: fields({
    email: AuthFieldConfigSchema,
    password: AuthFieldConfigSchema,
    confirmPassword: AuthFieldConfigSchema,
    name: AuthFieldConfigSchema,
  }),
  login: fields({
    credential: AuthFieldConfigSchema,
    password: AuthFieldConfigSchema,
  }),
  forgotPassword: fields({ email: AuthFieldConfigSchema }),
  resetPassword: fields({
    token: AuthFieldConfigSchema,
    password: AuthFieldConfigSchema,
    confirmPassword: AuthFieldConfigSchema,
  }),
  verifyEmail: fields({ token: AuthFieldConfigSchema }),
  changePassword: fields({
    currentPassword: AuthFieldConfigSchema,
    newPassword: AuthFieldConfigSchema,
    confirmPassword: AuthFieldConfigSchema,
  }),
  logout: fields({}),
});
export type AuthContractConfig = z.infer<typeof AuthContractConfigSchema>;
export type AuthFieldConfig = z.infer<typeof AuthFieldConfigSchema>;
export type EmptyStringPolicy = AuthFieldConfig['emptyStringPolicy'];

export function freezeConfig<T>(value: T): Readonly<T> {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeConfig);
    Object.freeze(value);
  }
  return value;
}

export const DefaultAuthContractConfig = freezeConfig({
  version: '1.0.0',
  register: {
    email: { required: true, emptyStringPolicy: 'reject' },
    password: { required: true, minLength: 6, emptyStringPolicy: 'reject' },
    confirmPassword: {
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    },
    name: {
      required: false,
      minLength: 2,
      maxLength: 100,
      emptyStringPolicy: 'reject',
    },
  },
  login: {
    credential: {
      required: true,
      minLength: 2,
      maxLength: 100,
      emptyStringPolicy: 'reject',
    },
    password: { required: true, minLength: 6, emptyStringPolicy: 'reject' },
  },
  forgotPassword: { email: { required: true, emptyStringPolicy: 'reject' } },
  resetPassword: {
    token: { required: true, minLength: 1, emptyStringPolicy: 'reject' },
    password: { required: true, minLength: 6, emptyStringPolicy: 'reject' },
    confirmPassword: {
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    },
  },
  verifyEmail: {
    token: { required: true, minLength: 1, emptyStringPolicy: 'reject' },
  },
  changePassword: {
    currentPassword: {
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    },
    newPassword: { required: true, minLength: 6, emptyStringPolicy: 'reject' },
    confirmPassword: {
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    },
  },
  logout: {},
} as const satisfies AuthContractConfig);
