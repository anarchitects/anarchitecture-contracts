import { z } from 'zod';
import {
  arrayInput,
  decodedJson,
  integerInput,
  stringInput,
  wireString,
} from './input.js';
export {
  LoggedInUserInfoResponseSchema as PasskeyAuthenticationFinishResponseSchema,
  SuccessResponseSchema as PasskeyRegistrationFinishResponseSchema,
} from './session.js';

export const PasskeyBase64UrlSchema = z.string().regex(/^[A-Za-z0-9_-]+$/);
const base64Input = stringInput(PasskeyBase64UrlSchema);
const attachment = z.enum(['platform', 'cross-platform']);
const verification = z.enum(['required', 'preferred', 'discouraged']);
const resident = z.enum(['required', 'preferred', 'discouraged']);
const extensions = z.record(z.string(), z.json());
const credentialFields = {
  id: base64Input,
  rawId: base64Input,
  type: stringInput(z.literal('public-key')),
  authenticatorAttachment: stringInput(attachment).optional(),
  clientExtensionResults: z.record(z.string(), decodedJson),
};
export const PasskeyRegistrationCredentialSchema = z.object({
  ...credentialFields,
  response: z.object({
    clientDataJSON: base64Input,
    attestationObject: base64Input,
    authenticatorData: base64Input.optional(),
    publicKey: base64Input.optional(),
    publicKeyAlgorithm: integerInput.optional(),
    transports: arrayInput(stringInput(wireString(1))).optional(),
  }),
});
// Legacy anyOf tries string first, then null. Null or '' become null after the
// nonempty string branch fails; zero/false become valid base64url strings.
const nullableHandle = stringInput(z.string())
  .transform((value) => (value === '' ? null : value))
  .pipe(PasskeyBase64UrlSchema.nullable());
export const PasskeyAuthenticationCredentialSchema = z.object({
  ...credentialFields,
  response: z.object({
    clientDataJSON: base64Input,
    authenticatorData: base64Input,
    signature: base64Input,
    userHandle: nullableHandle.optional(),
  }),
});
export const PasskeyRegistrationBeginRequestSchema = z.object({
  authenticatorAttachment: stringInput(attachment).optional(),
});
export const PasskeyRegistrationFinishRequestSchema = z.object({
  response: PasskeyRegistrationCredentialSchema,
  name: stringInput(wireString(1, 255).regex(/\S/)).optional(),
});
export const PasskeyAuthenticationBeginRequestSchema = z.object({});
export const PasskeyAuthenticationFinishRequestSchema = z.object({
  response: PasskeyAuthenticationCredentialSchema,
});

const descriptor = z.strictObject({
  id: PasskeyBase64UrlSchema,
  type: z.literal('public-key'),
  transports: z.array(wireString(1)).optional(),
});
export const PasskeyRegistrationBeginResponseSchema = z.strictObject({
  rp: z.strictObject({ name: wireString(1), id: wireString(1).optional() }),
  user: z.strictObject({
    id: PasskeyBase64UrlSchema.and(wireString(1, 86)),
    name: z.string(),
    displayName: z.string(),
  }),
  challenge: PasskeyBase64UrlSchema,
  pubKeyCredParams: z
    .array(
      z.strictObject({
        type: z.literal('public-key'),
        alg: z.number().multipleOf(1),
      }),
    )
    .min(1),
  timeout: z.number().multipleOf(1).min(0).optional(),
  excludeCredentials: z.array(descriptor).optional(),
  authenticatorSelection: z
    .strictObject({
      authenticatorAttachment: attachment.optional(),
      requireResidentKey: z.boolean().optional(),
      residentKey: resident.optional(),
      userVerification: verification.optional(),
    })
    .optional(),
  attestation: z.enum(['none', 'indirect', 'direct', 'enterprise']).optional(),
  attestationFormats: z.array(wireString(1)).optional(),
  extensions: extensions.optional(),
  hints: z.array(wireString(1)).optional(),
});
export const PasskeyAuthenticationBeginResponseSchema = z.strictObject({
  challenge: PasskeyBase64UrlSchema,
  timeout: z.number().multipleOf(1).min(0).optional(),
  rpId: wireString(1).optional(),
  allowCredentials: z.array(descriptor).optional(),
  userVerification: verification.optional(),
  extensions: extensions.optional(),
  hints: z.array(wireString(1)).optional(),
});
