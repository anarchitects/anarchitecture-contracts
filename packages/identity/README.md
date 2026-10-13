# @anarchitects/identity-contracts

Canonical Zod 4 schemas and HTTP operation definitions for profile create/read/
update. This workspace is unreleased; `0.0.0` is the development version pending
the first Changesets release.

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

## Generated review artifacts

Explicit file exports now include `./openapi/identity-review.json`,
`./openapi/identity-review.yaml`, `./openapi/inventory.json` and `./manifest.json`.
They are generated from these canonical schemas and operations and are verified
in clean tarballs. Runtime imports do not load the files.

The files are **review-only** and claim no supported deployment capabilities.
P07 exceptions are reviewed per operation and pinned to source/generator bytes.
Real host evidence remains unresolved; protected routes remain in the inventory
until host security bindings are resolved. Review `docs/openapi.md` and
`docs/openapi-projection-proposal.md` in the source repository before using them.
