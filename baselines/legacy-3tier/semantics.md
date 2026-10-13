# Legacy semantics and migration decisions

Read with the [evidence and replay limits](README.md), [operation map](operations.md),
[route schema values](routes.json) and [HTTP fixtures](http.json).
Fixture IDs below are stable lookup keys in `http.json` and
[`cases.cjs`](../../tools/legacy-baseline/cases.cjs). A recorded defect is evidence
for review, not approval to institutionalize it in a new public contract.

## Discrepancy register

| ID  | Classification                                         | Evidence                                                                                                                                                                                                                                              | Required disposition                                                                                                                                                                                    |
| --- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01 | Missing generated routes                               | Controllers expose three `/auth/jwt/*` operations; Angular `JwtAuthApi` calls them. Generator exposes none and metadata gives them no operationId. `jwt-*` fixtures exercise all three.                                                               | #4/#5/#7: explicitly decide supported JWT surface and operationIds; do not silently remove an active client API or invent IDs as historical facts.                                                      |
| D02 | Orphan operation metadata                              | `refreshTokens` metadata names `POST /auth/refresh-tokens/{userId}`; no controller or generated operation; fixture `auth-obsolete-refresh-route` returns 404.                                                                                         | #7: remove the stale metadata from future generation; do not resurrect this route during extraction.                                                                                                    |
| D03 | Incomplete error/security/header description           | All 26 generated operations describe success only. No operation security declaration, cookie forwarding, Retry-After or native no-store headers. Guard composition changes `/auth/me` from 400 to 401 for no session.                                 | #4/#5–#7: model actual host profiles, observed failures and headers; absence in OpenAPI must not imply public access.                                                                                   |
| D04 | Validator-dependent acceptance                         | Core Fastify AJV coerces numeric strings/numbers and strips properties when `additionalProperties:false`; Newsletter presentation replaces validation with strict TypeBox `Value.Check`. Its module hook is absent from the spec-only generator host. | #4–#6: preserve per-operation input/output semantics or explicitly review a versioned change. A single Zod strict/strip/coerce default cannot represent every route.                                    |
| D05 | Forms schema not enforced on submit                    | Definition schema requires `email`, format email and no extra properties. Submit accepts `{}`, invalid email and extra payload keys, then calls persistence. `forms-submit-*dynamic*`, `forms-submit-unknown-payload-property`.                       | **Review required** for #6: decide enforcement and migration/version impact separately; extraction must not silently change acceptance.                                                                 |
| D06 | Forms service default unreachable over HTTP            | Service can default formVersion to 1; submit HTTP schema requires it and returns 400 if omitted. GET definition defaults omitted query version to 1.                                                                                                  | #6: distinguish request requirements from internal defaults.                                                                                                                                            |
| D07 | Broad Auth response contract / stale generator doubles | Session response `user` is unconstrained; actual service returns user plus ordered `rbac`. Generator stubs still use older token/user return shapes and are never executed by spec generation.                                                        | #5: design the Zod wire surface from observed behavior and supported host configuration, not generator doubles. Narrowing arbitrary `user` needs review.                                                |
| D08 | Forms configuration exposes delivery secrets           | `forms-definition-delivery-secret` returns a configured `delivery.webhooks[0].secret` through the real mapper and serializer. Synthetic value only; no production exposure was tested.                                                                | **Security review required** for #6 and 3-tier follow-up: decide redaction, host access restrictions and compatibility/version impact before canonicalizing this field. This audit changes no endpoint. |
| D09 | Conditional routes advertised unconditionally          | Generator includes native Newsletter actions and webhook; actual modules can disable them and return 404. `newsletter-*-disabled`.                                                                                                                    | #6/#7: state composition requirements; a generated operation does not prove a deployment enables it.                                                                                                    |
| D10 | No declared pagination; permissive query forwarding    | Forms list declares only formId/formVersion. Unknown `limit`/`offset` reach the repository as strings; response remains an array.                                                                                                                     | #6: do not invent pagination or assume unknown fields are rejected. Product repository behavior remains outside this fixture.                                                                           |
| D11 | Nullable schema differs from HTTP mutation             | `identity-create-nullable` and `identity-patch-null` accept null but AJV coerces it to empty string before the mapper. Omitted fields stay absent from writes; repository nulls serialize as null.                                                    | **Review required** for #6: distinguish schema-level nullability, request mutation and response nullability; do not claim a plain Zod nullable string preserves current behavior.                       |

No discrepancy is resolved by this audit. #4 defines the extraction conventions;
Issues #5 and #6 must record decisions for their domain rows before calling the Zod
surface canonical. #7 owns deterministic generation and compatibility comparison.
Any deliberate wire break requires a separately reviewed, versioned migration.

## Auth and passkeys

Default TypeBox DTO values are captured after `createDefaultAuthContracts()` is
bound to controller placeholders. Hosts can configure Auth schemas; this is the
default-host baseline, not a claim that arbitrary overrides are equivalent.

- Registration requires email, password and confirmPassword; password minimum is
  six characters. Optional name is not nullable and, when present, has length
  2–100. Missing name succeeds; empty/null name fails. Mismatched passwords fail
  in orchestration. Existing user produces 400 in the controlled repository case.
- Login requires credential (2–100 characters) and password (minimum six). AJV
  coerces numeric values to strings. Unknown registration keys are retained into
  the engine port. Core logout's empty object schema strips unknown keys.
- Token actions require nonempty strings. Update-email requires newEmail with
  email format; password is optional in the schema. Change-password requires
  currentPassword, newPassword and confirmPassword. Do not derive the actual
  password policy from a new library default.
- Session login and `/me` serialize `{user, rbac}`; JWT login/refresh serialize
  `{accessToken, refreshToken}`. Never conflate the two auth modes. The default
  `user:{}` schema does not project a minimal public user. Date values within the
  synthetic user serialize as ISO strings.
- `auth-login-policy-wire-order` proves wire preservation of policy order,
  conditions, fields, inverted flags and reason. Policy evaluation/conformance
  remains in auth-ts; this fixture does not reimplement or verify evaluation.
- Login forwards incoming Cookie and multiple returned Set-Cookie values.
  Logout forwards an expiry cookie; passkey controller calls also forward engine
  cookies. `/me` returns only `result.body` and does not forward engine headers.
  Freeze the forwarding behavior, not these fake provider cookie values.
- Public metadata permits registration, activation, login, forgot/reset password,
  verify-email and passkey authentication. Registration ceremonies need a session
  when the AuthenticationGuard is installed. JWT endpoints are Public and perform
  their own credential/token checks. Product ownership/authorization is not
  inferable from these DTOs.
- Passkey JSON uses nonempty **unpadded base64url** strings; `padded=` fails.
  Assertion `userHandle` may be omitted or null. Registration name is optional,
  length 1–255 with at least one non-whitespace character. Closed objects are
  stripped by Fastify, so injected registration `userId` never reaches the port.
  Strict rejection would change the observed request behavior.
- Errors have statusCode/message; Nest exceptions generally add error, while
  Fastify schema failures and the Newsletter 429 omit it. Do not require error
  on every failure. Schema failures produce 400; controlled login/verifier denial 401;
  reset/verify provider failures are mapped to 400 `Invalid token`. JWT malformed
  or invalidated refresh tokens return 400. Fixtures preserve exact observed
  bodies, but a future error standardization still requires review.

## Forms

- Definition GET takes formId and optional query formVersion; query `2` becomes
  integer 2, omitted version reaches the provider as 1, zero fails. Response is
  `{config, schema}`. The schema is dynamically derived from the form fields.
- Submit requires formId, integer formVersion >=1 and an object payload. String
  version `"2"` is coerced. Null payload, malformed JSON or omitted version fails
  before persistence. The payload is an arbitrary record at the route boundary;
  dynamic field validation is bypassed (D05).
- List returns an array, with optional formId (minimum length 1) and formVersion
  (integer >=1) filters. Detail requires UUID syntax and returns 404 if absent.
  Submission identifiers are strings in response schemas, despite stricter detail
  input. createdAt/updatedAt serialize as ISO date-time strings, not Date objects.
- Definition config carries UI, validation, security and delivery configuration.
  D08 records secret forwarding and requires review before extraction. The audit
  fixture is an unguarded host and does not establish access rules in deployments.

## Identity

- Create requires authUserId as a string. Mutable fields displayName, givenName,
  familyName, avatarUrl, locale and timeZone are optional and allow null **in the
  schema**. At HTTP runtime, the first string branch coerces explicit null to an
  empty string before the mapper (D11). They are plain strings, without URL/locale/time-zone format checks in the schema.
- PATCH permits an empty object; explicit null becomes an empty string at the
  HTTP boundary. Omission, input null and stored/response null must be tracked
  separately. The request schema allows extras, but the application mapper
  picks only mutable fields; an injected authUserId cannot transfer ownership.
- Numeric authUserId/displayName values are coerced to strings. Unknown request
  keys are ignored by the mapper; undeclared response properties are omitted by
  projection/serialization (`identity-response-drops-extra`).
- Response fields, including all nullable fields and both ISO date-time strings,
  are required. Do not replace required-nullable response properties with optional
  properties in Zod. Path IDs require one or more non-whitespace characters.
  Duplicate profile returns 400; absent profile 404; invalid input 400.

## Newsletter

- Normal subscription requires email, literal boolean true consent and a nonblank
  consentVersion. Host policy also checks the exact version (`v1` in fixtures).
  Optional source/website are strings up to 2048 characters, not nullable.
  Email uses the pinned regex and max length 254, not a generic email-format
  substitution. The service lowercases it and rejects surrounding whitespace.
- The presentation module's strict checker rejects unknown fields and string
  `"true"`; no coercion occurs. A nonempty honeypot website produces neutral 202
  before body validation, rate limiting or service work, even with missing required
  fields. `newsletter-honeypot-*` captures this exception to normal validation.
- Successful subscription returns exactly `{accepted:true}` with 202. Grant
  evidence is appended before subscriber transport. Storage failure prevents
  transport; provider failure returns sanitized 503 after retaining the grant.
  The fixture records call order, not database transaction guarantees.
- Rate denial returns 429 and Retry-After in rounded-up seconds (1501 ms -> `2`).
  Limiter unavailable or missing client key fails closed with sanitized 503.
- Native confirm/unsubscribe accept a required string token up to 128 characters,
  including empty string, and return neutral 202. Extra fields/wrong types fail
  400; action-port failure maps to 503. Responses carry Cache-Control: no-store and
  Referrer-Policy: no-referrer. GET is 404 and must not trigger actions. Expiry,
  reuse, confirm/unsubscribe token purpose and actual mail/link behavior require
  the native implementation's lifecycle tests; this harness uses controlled ports.
- Webhook receives raw bytes, with a 64-hex-character SHA-256 HMAC in the
  `signature` header. The actual adapter verifies the exact bytes and account
  before recording withdrawal evidence. Missing/bad signature returns 401,
  invalid payload/wrong account 400, configured size excess 413, missing raw-body
  capture or persistence outage 503. Disabled webhook route is 404.
- A valid event returns `{recorded:1,duplicates:0}`; the second identical event
  returns `{recorded:0,duplicates:1}` using the same stable dedupe key. The fake
  repository models its `recorded`/`duplicate` result; durable idempotency is not
  proven. Signed fixture input is whitespace-sensitive and kept as rawBody.

## Consumer and ownership inventory

All links below target the audited revision. Paths and source-file hashes are
also indexed in [provenance.json](provenance.json). No client adopts Contracts yet.

| Consumer / owner                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Current dependency and behavior                                                                                                          | Extraction constraint                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [AuthApi](https://github.com/anarchitects/anarchitecture-bricks-3tier/blob/ecda1b6e0d9bc39c66373452a92dce91e06abee0/libs/auth/angular/data-access/src/auth-api.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                           | Imports auth-ts DTOs; builds `/api/{resource}` URLs; session user/RBAC envelope and policy parser                                        | Preserve session wire shape and auth-ts policy semantics; host prefix is outside route metadata           |
| [JwtAuthApi](https://github.com/anarchitects/anarchitecture-bricks-3tier/blob/ecda1b6e0d9bc39c66373452a92dce91e06abee0/libs/auth/angular/data-access/jwt/src/jwt-auth-api.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                | Imports JWT DTOs; calls `/auth/jwt/login`, logout and refresh; token mode                                                                | Active consumer of the three undocumented routes (D01)                                                    |
| [PasskeyApi](https://github.com/anarchitects/anarchitecture-bricks-3tier/blob/ecda1b6e0d9bc39c66373452a92dce91e06abee0/libs/auth/angular/data-access/passkeys/src/passkey-api.ts) and [WebAuthn client](https://github.com/anarchitects/anarchitecture-bricks-3tier/blob/ecda1b6e0d9bc39c66373452a92dce91e06abee0/libs/auth/angular/data-access/passkeys/src/web-authn-client.ts)                                                                                                                                                                                                                            | Dedicated DTO entry point; withCredentials, suppressed auth redirect, options default `{}`, credential serialization and session parsing | Keep base64url, optional/null fields, cookie behavior and credential ceremony boundary                    |
| [FormsApi](https://github.com/anarchitects/anarchitecture-bricks-3tier/blob/ecda1b6e0d9bc39c66373452a92dce91e06abee0/libs/forms/angular/data-access/src/forms-api.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                        | Imports forms-ts DTOs; configurable base/path; stringifies formVersion; consumes envelope and submission routes                          | Keep envelope, version semantics, encoded IDs and unpaginated array                                       |
| [IdentityApi](https://github.com/anarchitects/anarchitecture-bricks-3tier/blob/ecda1b6e0d9bc39c66373452a92dce91e06abee0/libs/identity/angular/data-access/src/identity-api.ts)                                                                                                                                                                                                                                                                                                                                                                                                                               | Imports identity-ts DTOs; exposes get-by-auth-user and PATCH using configured `/api/.../profiles`                                        | Preserve mutable-field optional/null semantics; server create/get-by-id also remain inventory scope       |
| [NewsletterApi](https://github.com/anarchitects/anarchitecture-bricks-3tier/blob/ecda1b6e0d9bc39c66373452a92dce91e06abee0/libs/newsletter/angular/data-access/src/newsletter-api.ts)                                                                                                                                                                                                                                                                                                                                                                                                                         | Imports newsletter-ts DTOs; configured subscriptionUrl, declared-field projection, transferCache false, timeout, generic errors          | No client email normalization or synthesized consent; expects literal accepted true                       |
| [Auth DTOs](https://github.com/anarchitects/anarchitecture-bricks-3tier/tree/ecda1b6e0d9bc39c66373452a92dce91e06abee0/libs/auth/ts/src/dtos), [Forms DTOs](https://github.com/anarchitects/anarchitecture-bricks-3tier/tree/ecda1b6e0d9bc39c66373452a92dce91e06abee0/libs/forms/ts/src/dtos), [Identity DTOs](https://github.com/anarchitects/anarchitecture-bricks-3tier/tree/ecda1b6e0d9bc39c66373452a92dce91e06abee0/libs/identity/ts/src/dtos), [Newsletter DTOs](https://github.com/anarchitects/anarchitecture-bricks-3tier/tree/ecda1b6e0d9bc39c66373452a92dce91e06abee0/libs/newsletter/ts/src/dtos) | Legacy TypeBox authoring, TypeScript DTOs and parsers consumed by Nest and Angular                                                       | Audit references only; future Zod authoring belongs to Contracts; domain models/invariants stay in Bricks |
| [Generator](https://github.com/anarchitects/anarchitecture-bricks-3tier/blob/ecda1b6e0d9bc39c66373452a92dce91e06abee0/tools/api-specs/generate.ts) and [metadata](https://github.com/anarchitects/anarchitecture-bricks-3tier/blob/ecda1b6e0d9bc39c66373452a92dce91e06abee0/tools/api-specs/route-metadata.ts)                                                                                                                                                                                                                                                                                               | Reflect selected controller route schemas with service doubles; snapshot contains operationIds only                                      | Byte stability is established for the old generator; completeness is not (D01–D04, D07, D09)              |

## Downstream acceptance requirements

1. #4 assigns domain package boundaries and documents handling of required,
   optional, nullable, unknown keys, coercion, defaults and formats per operation.
   Resolve the discrepancy rows with explicit owners and version decisions.
2. #5/#6 author Zod schemas once, infer types, and compare parsing **and serialized
   HTTP output** with these fixtures. Optional/null and array order need semantic
   assertions, not only schema text diffs. Preserve non-lossy policy wire mapping.
3. #7 generates OpenAPI deterministically from that authored source, covering
   supported routes, operationIds, responses, headers and security profiles.
   Correcting legacy omissions must be distinguished from changing the wire.
4. #8 verifies packed consumers and real host behavior before adoption claims.
   Cover deployment guards, browser cookies/CSRF, WebAuthn ceremonies, native token
   lifecycle and database durability in their owning systems. This frozen audit
   supplies a migration starting point, not evidence that those gates have passed.
