# @anarchitects/identity-contracts

Canonical Zod 4 schemas and HTTP operation definitions for profile create/read/
update. This workspace is unreleased; `0.0.0` is the development version pending
the first Nx Release.

The root exports schemas, inferred types, the immutable `identitySchemas` catalog,
four `identityOperations` and unresolved `identityProfiles` requirements.
`./schemas` and `./operations` expose focused entry points. ESM and CommonJS builds
have their own declarations. Zod `4.5.0` is the only runtime dependency; this package
does not depend on Auth, a framework or an implementation's domain model.

Request input types and parsed types differ deliberately: numeric primitives and
singleton arrays coerce to strings, explicit null becomes an empty string, and
omitted mutable fields stay omitted. This preserves baseline discrepancy D11.
Unknown fields survive request validation; the implementation's mapper still
owns ignoring non-mutable fields, including an injected authUserId on PATCH.
A contract parser is not an ownership or authorization check.

Responses require every nullable profile field and serialized ISO timestamps.
They never turn Date objects into strings or silently project away unexpected
response fields. Auth-user IDs remain opaque wire strings rather than Auth models.
Protected profile operations require reviewed host authentication/authorization
bindings; unguarded baseline success is not a promise of anonymous access.

Repository `yarn check` verifies the frozen cases, expanded validator comparisons,
packed exports/types and browser bundling. See
`packages/identity/compatibility/README.md` in the source repository for evidence
and scope. Generated OpenAPI and the profile-resolution mechanism are implemented by #7; publication and
independent conformance tooling remain #8. Runtime adoption is separate Bricks
work, and no deployment or migration claim is made by this package.

## Canonical artifacts and separate host conformance

Explicit exports include `./openapi/identity-canonical.json` and its YAML
sibling, `./openapi/inventory.json` and `./manifest.json`. Existing
`./openapi/identity-review.json`/YAML exports remain diagnostic. Runtime imports
do not load these files; clean tarball consumers verify them independently.

Canonical artifacts are implementation-independent and publishable without a host
after contract validity, compatibility and package checks. Format-2 manifests
separate publication validity, implementation conformance and deployment compliance.
They claim no supported capabilities or deployment readiness. Protected operations
remain in the inventory with normative security obligations and stay excluded from
OpenAPI paths until host bindings resolve. P07 reviews remain scoped and pinned;
OpenAPI-only validation cannot replace canonical Zod parsing.

First distribution is exactly `0.0.1`; pre-release development uses non-bumping
`init(identity-contracts)` commits, and later versions use Nx Conventional Commits.
Hosts consume exact published versions and independently prove positive/negative
HTTP behavior, security, headers and cookies before claiming support. See
`docs/openapi.md`, `docs/releases.md` and ADR-0005 in the source repository.
