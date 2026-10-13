# @anarchitects/auth-contracts

Canonical Zod 4 schemas and first-class HTTP operations for the existing Auth
session, JWT and passkey surface. This workspace is unreleased; version `0.0.0`
is a development placeholder for the first Changesets release, not a published
or verified deployment contract.

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

OpenAPI generation and resolved security artifacts arrive in #7. Provider/session
integration, cryptographic passkey verification, policy evaluation parity and
actual consumer adoption remain in the owning Bricks work; these schemas do not
implement those services. Publication and independent conformance gates remain
in #8. Package availability must not be represented as adoption.
