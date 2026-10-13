# Auth extraction record — issue #5

## Scope and provenance

`@anarchitects/auth-contracts` is an unreleased `0.0.0` workspace with a pending
minor Changeset for the initial `0.1.0` line. This change authors schemas and
operations; it makes no intentional wire migration or adoption claim.

Reviewed all 15 Meta ADRs at `e2f34553c6e2492d0ab6f80ac795de44fc592a70`
and both local ADRs through the #4 merge `85297700fd829db14c3806354cde2c310a8c77f7`.
Accepted ownership and framework independence govern this extraction. Proposed
modernization does not override accepted decisions or move policy meaning out of
auth-ts. The unchanged #3 baseline pins Bricks 3-tier at
`ecda1b6e0d9bc39c66373452a92dce91e06abee0`.

## Operation and behavior evidence

The exported `authOperations` registry is the operation-level evidence index.
Every definition records its original route, fixture IDs, applicable D01–D07
findings, semantic requirements and exact response schemas. Its 17 operations
cover session/account flows (10), JWT (3) and passkeys (4).

- Retain the 14 historical operationIds. D01 adds `loginWithJwt`, `logoutWithJwt`
  and `refreshJwtTokens` to existing routes. D02 excludes the obsolete
  `refreshTokens` route; the frozen 404 fixture remains intact.
- D04 preserves primitive/singleton-array string coercion, Unicode code-point
  lengths, the audited email grammar and unknown-key behavior. Open account/JWT
  objects preserve decoded JSON extras; logout and passkey closed objects strip
  them. Object values do not unwrap from singleton arrays.
- Passkeys preserve nested stripping, unpadded base64url, optional/null userHandle,
  credential names and integer/array coercion. The old base64 regex's trailing
  newline behavior is retained; tightening it needs a separate reviewed change.
- Password equality, account existence, tokens and verifier decisions remain
  application outcomes. Valid schema input can still yield the recorded 400/401.
  Both legacy 400 envelopes remain supported. Zod issues are not HTTP errors.
- D07 keeps `{ user, rbac }`, arbitrary serialized user JSON and ordered policy
  rules with conditions, fields, inverted denials and reasons. No grants are
  evaluated, reordered or expanded. JWT responses remain access/refresh tokens.
- D03 records cookie forwarding/expiry, repeated Set-Cookie values, protected
  routes, observed errors and explicitly conditional host errors. `/auth/me`
  does not forward engine response headers. Fixture cookie names are not a
  production promise. Untested host 403/500 behavior is not claimed proven.

`tools/contract-authoring/compatibility.test.mjs` compares frozen request parsing
and every observed Auth/Identity response, plus an expanded per-field corpus,
against the pinned AJV configuration. Domain tests check passkey stripping,
nullable handles and policy representation. These tests use public built exports
and frozen data, with AJV only as a development oracle. They are not a new server
adapter or a claim of cryptographic/WebAuthn/provider conformance.

A supplemental pinned-source HTTP probe accepted raw
`{"credential":1e309,"password":1e309}` on `POST /auth/login` and supplied the
engine with `"Infinity"` strings. The parser preserves this JSON exponent-overflow
behavior, including nested open values; NaN and arbitrary JavaScript objects
remain unsupported. The source audit event recorder serializes non-finite extra
values as null, so only declared string-field normalization was established by
that event output. Differential tests also cover decoded overflow values.

## Packaging and remaining gates

Clean tarballs contain only built artifacts, package metadata, README and MIT
license. Zod 4.5.0 is the sole runtime dependency. Checks load every export as ESM
and CommonJS, compile strict TypeScript 5.5.4/6.0.3 consumers with NodeNext/bundler
resolution and bundle browser imports without Node shims. Local runtime evidence
uses Node 22.13.0 and 24.21.0; CI repeats those installed-artifact targets.

The following prevent stable capability/release claims:

1. **Request generation (#7):** native Zod input conversion cannot represent the
   decoded numeric-overflow branch and deliberately throws. Even without that
   branch, a transform's input projection loses post-conversion constraints
   (for example password length). No `{}` fallback, manually authored JSON Schema
   or coercion removal is allowed. #7 must resolve a faithful representation or
   obtain a reviewed exception before releasing affected operations. Response
   schemas convert natively; this alone does not prove input parity.
2. **Resolved profiles (#7 and Bricks adoption):** `authProfiles` enumerates
   session, session/passkey and JWT capability requirements. Security bindings,
   production cookies, CSRF/session transport, ownership and host error policy
   remain unresolved. Public JWT routes still require token verification in the
   application. Untested protection must never default to anonymous access.
3. **Runtime/semantic conformance:** actual session engines, challenge/signature
   verification, JWT lifecycle, auth-ts evaluation/mapping parity and consumer
   integration remain in their owning repositories. Frozen fixtures use controlled
   collaborators; passing them is bounded transport evidence.
4. **Publication (#8):** npm name/permission checks, provenance, immutable adoption
   pins and independent deployment conformance remain required. No artifacts are
   published by this change.

## Issue #7 generation status

Generated JSON/YAML review artifacts, inventories and package manifests now exist.
The [generation guide](../../../docs/openapi.md) and
[proposed projection exception P07](../../../docs/openapi-projection-proposal.md)
record the exact remaining conversion and profile gates. No parser changes or
release approvals are introduced; earlier runtime and security limits still apply.
