# @anarchitects/auth-contracts

Canonical Zod 4 schemas and first-class HTTP operations for the existing Auth
session, JWT and passkey surface. Version `0.0.1` is immutable. The configurable
factory described below is a pending addition tracked in Contracts #23; it is
not available in `0.0.1`. Publication does not establish host conformance.

## Exports

| Entry                          | Content                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `@anarchitects/auth-contracts` | Public schemas/types, immutable schema catalog, operations and profile requirements |
| `./schemas`                    | Named Zod schemas and inferred input/output types                                   |
| `./operations`                 | 17 operation definitions, capability registries and profile requirements            |
| `./jwt`                        | JWT request/response schemas, types and three operations                            |
| `./passkeys`                   | Credential/options schemas, types and four ceremony operations                      |
| `./policy`                     | Policy HTTP representation only; no policy evaluator                                |

ESM and CommonJS builds have separate declarations. Zod `4.5.0` is the only runtime
dependency. No Nest, Fastify, TypeBox, AJV, Angular or implementation package is
required. Public types are inferred from schemas; implementations map their own
service/domain values to these wire types.

Request parsing preserves the frozen boundary's primitive and singleton-array
coercion, Unicode lengths, unknown-key handling and passkey null semantics.
`LoginRequestInput` describes pre-normalization values; `LoginRequest` describes
parsed output. Password equality and engine decisions remain in the service.
Do not expose Zod issues as a replacement HTTP error envelope.

Responses validate serialized JSON without coercion or field projection. The
`user` field remains open JSON; RBAC order, conditions, fields, inverted flags and
reasons are retained. auth-ts continues to own policy meaning and evaluation.

Operations distinguish session envelopes from JWT token responses, retain the
14 documented Auth IDs, and add `loginWithJwt`, `logoutWithJwt` and
`refreshJwtTokens` for the three existing undocumented routes. Cookie metadata
requires forwarding separate Set-Cookie values; it does not prescribe a provider's
cookie name or issue cookies. Protected operations require explicit host bindings.
`authProfiles` describes unresolved profile requirements, not deployment approval.

## Evidence and remaining gates

Repository `yarn check` builds and tests frozen responses/requests, differential
validation, installed package exports/types and browser bundling. The source
baseline is Bricks revision `ecda1b6e0d9bc39c66373452a92dce91e06abee0`.
See `packages/auth/compatibility/README.md` in the source repository for the
migration record and evidence limits.

OpenAPI generation and profile resolution are implemented by #7. Provider/session
integration, cryptographic passkey verification, policy evaluation parity and
actual consumer adoption remain in the owning Bricks work; these schemas do not
implement those services. Publication and independent conformance gates remain
in #8. Package availability must not be represented as adoption.

## Canonical artifacts and separate host conformance

Explicit exports include `./openapi/auth-canonical.json` and its YAML
sibling, `./openapi/inventory.json` and `./manifest.json`. Existing
`./openapi/auth-review.json`/YAML exports remain diagnostic. Runtime imports
do not load these files; clean tarball consumers verify them independently.

Canonical artifacts are implementation-independent and publishable without a host
after contract validity, compatibility and package checks. Format-2 manifests
separate publication validity, implementation conformance and deployment compliance.
They claim no supported capabilities or deployment readiness. Protected operations
remain in the inventory with normative security obligations and stay excluded from
OpenAPI paths until host bindings resolve. P07 reviews remain scoped and pinned;
OpenAPI-only validation cannot replace canonical Zod parsing.

First distribution is exactly `0.0.1`; subsequent versions use Nx Conventional Commits.
Hosts consume exact published versions and independently prove positive/negative
HTTP behavior, security, headers and cookies before claiming support. See
`docs/openapi.md`, `docs/releases.md` and ADR-0005 in the source repository.

## Configurable session validation

The root export provides `createAuthContracts`, `DefaultAuthContractConfig`,
`AuthContractConfigSchema`, `AuthFieldConfigSchema` and their inferred types.
The factory accepts a complete typed configuration; consumers own merging host
overrides with defaults. Its detached configuration is frozen at construction.
Omitting the argument selects the default profile. Existing named schema exports
continue to use that same default profile.

```ts
import {
  createAuthContracts,
  DefaultAuthContractConfig,
} from '@anarchitects/auth-contracts';

const contracts = createAuthContracts({
  ...DefaultAuthContractConfig,
  login: {
    ...DefaultAuthContractConfig.login,
    password: {
      ...DefaultAuthContractConfig.login.password,
      minLength: 10,
    },
  },
});
const request = contracts.loginRequestSchema.parse({
  credential: 'reader',
  password: '1234567890',
});
```

The result includes all seven session request schemas, `config`, the complete
`schemas` catalog and `operations` with those request bodies bound to the same
schema instances. It changes no responses, paths, operation IDs, cookies or
security requirements. JWT login keeps its fixed default rules and has a distinct
`auth.jwt.LoginRequest` catalog ID in configured catalogs. Passkeys and policy
representations remain unchanged.

Each field supports required/optional presence and optional Unicode code-point
length bounds. Scalar and singleton-array coercion, email grammar, open request
extras and logout's unknown-key stripping preserve the Bricks baseline. Password
confirmation equality remains an application rule. Invalid configurations fail
at construction; bounds must be nonnegative integers with minimum ≤ maximum.
The configuration's `version` identifies a host validation profile, not npm SemVer.

`emptyStringPolicy` describes client payload shaping (`strip`, `reject`, `allow`).
It does **not** strip or reject values on the server. Empty-string server acceptance
follows presence, length and email constraints. Angular owns the actual payload
shaping; Nest validates with the canonical schema for the chosen configuration.
No Angular or Nest runtime dependency is introduced.

Packaged default OpenAPI is not an exact description of a differently configured
host. See the configured generation workflow in `docs/openapi.md` in the source
repository. Canonical Zod validation remains required for disclosed projection
limitations. No factory or artifact alone proves Bricks adoption.
