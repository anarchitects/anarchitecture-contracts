# Identity extraction record — issue #5

## Scope and provenance

`@anarchitects/identity-contracts` is an unreleased `0.0.0` workspace, with a
pending minor Nx version plan for `0.1.0`. Issue #5 explicitly covers Auth and Identity;
the #4 design guides' assignment of Identity to #6 is corrected without changing
package ownership or introducing a wire migration.

Reviewed all 15 Meta ADRs at `e2f34553c6e2492d0ab6f80ac795de44fc592a70`
and both local ADRs through `85297700fd829db14c3806354cde2c310a8c77f7`.
The immutable #3 baseline pins Bricks 3-tier at
`ecda1b6e0d9bc39c66373452a92dce91e06abee0`.

## Preserved behavior

`identityOperations` indexes each route's exact fixture references and dispositions
D03, D04 and D11. All four historical operationIds remain unchanged:
`createUserProfile`, `getUserProfileById`, `getUserProfileByAuthUserId` and
`updateUserProfile`. Paths/methods, 200 responses, duplicate-profile errors and
missing-profile 404s retain the frozen behavior.

D11 is explicit normalization: scalar/singleton-array values coerce to strings;
null becomes an empty string and omitted mutable fields remain omitted. Unknown
request properties survive validation, then the owning application mapper ignores
non-mutable fields. An injected authUserId on PATCH is not a supported ownership
transfer. Schema parsing cannot authorize profile access or replace that mapper.
No URL/locale/UUID validation is added to opaque legacy strings.

Responses require every nullable public field and serialized ISO timestamp.
They reject Date objects and unexpected projected fields without coercing or
stripping a bad response. This checks already serialized output; projection and
`.toISOString()` remain implementation work. The timestamp schema describes
mapper output rather than promising every string accepted by a generic legacy
`date-time` format validator.

The shared differential suite compares frozen request parsing and all observed
responses, plus expanded coercion/Unicode/omission cases, against the legacy AJV
configuration. Identity tests separately exercise null versus omission, mapper
boundaries and strict serialized output. A supplemental pinned-source HTTP probe
of `POST /identity/profiles` accepted
`{"authUserId":1e309,"displayName":-1e309}` and emitted `"Infinity"`/`"-Infinity"`
strings. The new schemas and regression test preserve this decoded JSON overflow.
The frozen baseline files were not rewritten.

## Packaging and remaining gates

Identity depends only on Zod 4.5.0, not Auth, a framework or a domain model.
Auth-user IDs are opaque Identity-owned transport strings. Clean tarball checks
load every ESM/CommonJS export, compile TypeScript 5.5.4/6.0.3 in strict
NodeNext/bundler modes and bundle browser consumers. Runtime checks target
Node 22.13.0 and 24.21.0 locally and in CI.

- Native input JSON Schema conversion intentionally fails on decoded numeric
  overflow. Post-conversion constraints also need faithful representation. Issue
  #7 must resolve generation or record a reviewed exception before releasing an
  affected operation; no schema fallback or silent coercion change is authorized.
- All four operations bind to unresolved `identity.protected` requirements.
  Unguarded core fixture success is not proof of anonymous access. Authentication,
  resource ownership and conditional host 401/403/500 behavior require resolved
  profiles and real implementation evidence. No Identity authorization result is
  proven by schema tests.
- Repository fixtures use controlled persistence collaborators; they do not prove
  database behavior, concurrency, authorization or production adoption. Runtime
  adapters and domain mappings belong to Bricks adoption work.
- Generated OpenAPI/profile artifacts remain #7; publication, provenance and
  independent conformance remain #8. A pending Nx version plan does not authorize
  publishing or establish deployment compatibility.

## Issue #7 generation status

Generated JSON/YAML review artifacts, inventories and package manifests now exist.
The [generation guide](../../../docs/openapi.md) and
[reviewed, scoped projection register P07](../../../docs/openapi-projection-proposal.md)
record faithful constraints, remaining exceptions and strict profile/evidence gates.
Synthetic verification is test-only; actual host evidence and capability blockers
remain outstanding. Existing legacy parsers and frozen HTTP observations are
preserved. #7 can complete independently of host remediation and #8 publication.
