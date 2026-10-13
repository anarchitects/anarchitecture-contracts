import { sessionOperations } from './session.js';
import { jwtOperations } from './jwt.js';
import { passkeysOperations } from './passkeys.js';
export * from './session.js';
export * from './jwt.js';
export * from './passkeys.js';
export const authOperations = Object.freeze([
  ...sessionOperations,
  ...jwtOperations,
  ...passkeysOperations,
] as const);
export type AuthOperation = (typeof authOperations)[number];

// Profile requirements, not resolved deployment credentials or adoption claims.
export const authProfiles = Object.freeze({
  session: {
    capabilities: ['auth.session'],
    protection: 'auth.protected',
    requiredBindings: [
      'session cookie transport',
      'resource authorization policy',
    ],
    unresolved: true,
  },
  'session-passkeys': {
    capabilities: ['auth.session', 'auth.passkeys'],
    protection: 'auth.protected',
    requiredBindings: [
      'session cookie transport',
      'resource authorization policy',
      'WebAuthn origin/RP and verifier',
    ],
    unresolved: true,
  },
  'jwt-plugin': {
    capabilities: ['auth.jwt'],
    requiredBindings: ['JWT verification and invalidation service'],
    unresolved: true,
  },
} as const);
