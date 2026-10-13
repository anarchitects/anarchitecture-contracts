import { z } from 'zod';

// Preserve decoded JSON exponent overflow as well as ordinary JSON numbers.
// This custom branch intentionally blocks misleading native input projection.
const decodedNumber = z.union([
  z.number(),
  z.custom<number>((value) => value === Infinity || value === -Infinity),
]);
const decodedJson: z.ZodType<z.infer<ReturnType<typeof z.json>>> = z.lazy(() =>
  z.union([
    z.string(),
    decodedNumber,
    z.boolean(),
    z.null(),
    z.array(decodedJson),
    z.record(z.string(), decodedJson),
  ]),
);
const scalar = z.union([z.string(), decodedNumber, z.boolean(), z.null()]);
const stringInput = z
  .union([scalar, z.tuple([scalar])])
  .transform((value) => {
    const item = Array.isArray(value) ? value[0] : value;
    return item === null ? '' : String(item);
  })
  .pipe(z.string());
// The legacy union tries string first: explicit null becomes ''. Omission stays
// omitted. Domain mapping (including ignoring authUserId on PATCH) stays outside.
const mutable = {
  displayName: stringInput.optional(),
  givenName: stringInput.optional(),
  familyName: stringInput.optional(),
  avatarUrl: stringInput.optional(),
  locale: stringInput.optional(),
  timeZone: stringInput.optional(),
};
export const CreateUserProfileRequestSchema = z
  .object({ authUserId: stringInput, ...mutable })
  .catchall(decodedJson);
export const UpdateUserProfileRequestSchema = z
  .object(mutable)
  .catchall(decodedJson);
export const ProfileIdSchema = stringInput.pipe(z.string().regex(/^\S+$/));
export const UserProfileIdParamsSchema = z
  .object({ profileId: ProfileIdSchema })
  .catchall(decodedJson);
export const AuthUserIdParamsSchema = z
  .object({ authUserId: ProfileIdSchema })
  .catchall(decodedJson);
const nullable = z.string().nullable();
export const UserProfileResponseSchema = z.strictObject({
  id: z.string(),
  authUserId: z.string(),
  displayName: nullable,
  givenName: nullable,
  familyName: nullable,
  avatarUrl: nullable,
  locale: nullable,
  timeZone: nullable,
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
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

export type CreateUserProfileRequestInput = z.input<
  typeof CreateUserProfileRequestSchema
>;
export type CreateUserProfileRequest = z.output<
  typeof CreateUserProfileRequestSchema
>;
export type UpdateUserProfileRequestInput = z.input<
  typeof UpdateUserProfileRequestSchema
>;
export type UpdateUserProfileRequest = z.output<
  typeof UpdateUserProfileRequestSchema
>;
export type UserProfileIdParamsInput = z.input<
  typeof UserProfileIdParamsSchema
>;
export type UserProfileIdParams = z.output<typeof UserProfileIdParamsSchema>;
export type AuthUserIdParamsInput = z.input<typeof AuthUserIdParamsSchema>;
export type AuthUserIdParams = z.output<typeof AuthUserIdParamsSchema>;
export type ProfileIdInput = z.input<typeof ProfileIdSchema>;
export type ProfileId = z.output<typeof ProfileIdSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;
export type BadRequestError = z.infer<typeof BadRequestErrorSchema>;
export type UnauthorizedError = z.infer<typeof UnauthorizedErrorSchema>;
export type ForbiddenError = z.infer<typeof ForbiddenErrorSchema>;
export type NotFoundError = z.infer<typeof NotFoundErrorSchema>;
export type InternalServerError = z.infer<typeof InternalServerErrorSchema>;

export const identitySchemas = Object.freeze({
  'identity.CreateUserProfileRequest': CreateUserProfileRequestSchema,
  'identity.UpdateUserProfileRequest': UpdateUserProfileRequestSchema,
  'identity.ProfileId': ProfileIdSchema,
  'identity.UserProfileIdParams': UserProfileIdParamsSchema,
  'identity.AuthUserIdParams': AuthUserIdParamsSchema,
  'identity.UserProfileResponse': UserProfileResponseSchema,
  'identity.ValidationError': ValidationErrorSchema,
  'identity.BadRequestError': BadRequestErrorSchema,
  'identity.UnauthorizedError': UnauthorizedErrorSchema,
  'identity.ForbiddenError': ForbiddenErrorSchema,
  'identity.NotFoundError': NotFoundErrorSchema,
  'identity.InternalServerError': InternalServerErrorSchema,
});
