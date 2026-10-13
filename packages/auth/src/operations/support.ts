import { z } from 'zod';
import type {
  ResponseDefinition,
  SemanticRequirement,
} from '../../../../tools/contract-authoring/operation-definition.js';
import {
  BadRequestErrorSchema,
  UnauthorizedErrorSchema,
  ForbiddenErrorSchema,
  InternalServerErrorSchema,
  SetCookieHeaderSchema,
} from '../schemas/session.js';

export const json = <T extends z.ZodType>(schema: T) =>
  ({
    kind: 'json',
    required: true,
    content: { 'application/json': schema },
  }) as const;
export const success = <T extends z.ZodType>(schema: T, cookies = false) =>
  ({
    outcome: 'success',
    description: 'Successful operation.',
    body: json(schema),
    headers: cookies
      ? [
          {
            name: 'set-cookie',
            schema: SetCookieHeaderSchema,
            presence:
              'Forward every value returned by the authentication engine; issuance and cookie names are host-bound.',
            cardinality: 'repeated',
          } as const,
        ]
      : [],
    semantics: cookies ? ['auth.cookie-forwarding'] : [],
  }) as const satisfies ResponseDefinition<z.ZodType>;
const error = <T extends z.ZodType>(schema: T, description: string) =>
  ({
    outcome: 'error',
    description,
    body: json(schema),
    headers: [],
    semantics: [],
  }) as const;
export const badRequest = error(
  BadRequestErrorSchema,
  'Invalid transport input or rejected application request; preserve the applicable legacy envelope and message.',
);
export const unauthorized = error(
  UnauthorizedErrorSchema,
  'Authentication or credential verification failed.',
);
export const forbidden = error(
  ForbiddenErrorSchema,
  'Host authorization denied the request, where the resolved protection profile installs that policy.',
);
export const serverError = error(
  InternalServerErrorSchema,
  'Unhandled failure; host exception boundary returns a sanitized internal error.',
);
export const baselineRevision = 'ecda1b6e0d9bc39c66373452a92dce91e06abee0';
export const normalization = {
  id: 'auth.legacy-normalization',
  phase: 'normalization',
  description:
    'Preserve audited JSON primitive/single-item-array coercion and per-object unknown-key handling. Apply field constraints after conversion. JSON Schema input projection alone cannot express every post-conversion constraint.',
  fixtures: [
    'auth-login-number-coercion',
    'auth-register-unknown-property',
    'auth-logout-strips-unknown',
  ],
} as const satisfies SemanticRequirement;
export const cookies = {
  id: 'auth.cookie-forwarding',
  phase: 'response',
  description:
    'Forward incoming Cookie and all engine Set-Cookie values separately. Preserve logout expiry. Never infer production cookie names, CSRF policy or issuance from fixture values.',
  fixtures: ['auth-login', 'auth-logout', 'passkey-registration-begin'],
} as const satisfies SemanticRequirement;
export const policy = {
  id: 'auth.policy-wire',
  phase: 'response',
  description:
    'Preserve user JSON and ordered RBAC conditions, fields, inverted flags and reasons. Map without loss to auth-ts; do not evaluate policies here. The me controller does not forward engine response headers.',
  fixtures: ['auth-login-policy-wire-order', 'auth-me'],
} as const satisfies SemanticRequirement;
export const protection = {
  id: 'auth.host-protection',
  phase: 'authentication/authorization',
  description:
    'Protected routes require a resolved host session/authorization binding. Missing/invalid sessions are 401 with AuthenticationGuard; unguarded me yields 400. Cookie possession alone does not prove resource authorization.',
  fixtures: [
    'auth-me-no-session-guarded',
    'auth-me-no-session-unguarded',
    'auth-guard-invalid-session',
    'passkey-guard-registration',
  ],
} as const satisfies SemanticRequirement;
export const passkeyVerification = {
  id: 'auth.passkey-verification',
  phase: 'authentication/authorization',
  description:
    'JSON parsing is not WebAuthn verification. The engine verifies challenge, trusted origin/RP, user verification and credential binding. Preserve optional/null userHandle and strip injected registration identity fields.',
  fixtures: [
    'passkey-authentication-verifier-rejects',
    'passkey-authentication-finish-null-handle',
    'passkey-registration-strips-user-id',
  ],
} as const satisfies SemanticRequirement;
