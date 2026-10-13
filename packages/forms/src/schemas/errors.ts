import { z } from 'zod';
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
export const InternalServerErrorSchema = z.union([
  z.strictObject({ statusCode: z.literal(500), message: z.string() }),
  exception(500),
]);
