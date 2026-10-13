import { z } from 'zod';
import { decodedJson, stringInput, wireString } from './input.js';
export { LoginRequestSchema as JwtLoginRequestSchema } from './session.js';

export const JwtRefreshRequestSchema = z
  .object({ refreshToken: stringInput(wireString(1)) })
  .catchall(decodedJson);
export const JwtLogoutRequestSchema = z
  .object({
    refreshToken: stringInput(wireString(1)),
    accessToken: stringInput(wireString(1)).optional(),
  })
  .catchall(decodedJson);
export const JwtTokensResponseSchema = z.strictObject({
  accessToken: wireString(1),
  refreshToken: wireString(1),
});
