# OpenAPI generation and compatibility gates

Issue #7 adds deterministic OpenAPI 3.1.1 JSON/YAML generation directly from the
four canonical Zod catalogs and operation registries. Legacy TypeBox and upstream
OpenAPI are comparison evidence only. The generator imports no Bricks runtime,
boots no server, and never reads the baseline while producing schemas or paths.

**Current artifacts are review-only.** The
[bounded projection proposal](openapi-projection-proposal.md) requires approval,
and host security/behavior bindings remain unresolved. All 29 operations appear
in diagnostic inventories; only the 14 explicitly public operations appear in
the default OpenAPI paths. Protected operations are excluded with reasons, never
silently declared public. Forms D05/D08 remain stable capability blockers.

## Commands and CI

```sh
yarn openapi:generate                # build, generate and lint review artifacts
yarn openapi:check                   # fail on byte drift; never rewrite files
yarn test:openapi                    # snapshots, mutation and compatibility tests
yarn openapi:compatibility origin/main # package-aware PR release-plan gate
yarn check                          # full workspace, contract and package checks
```

CI runs generation verification and tests through `yarn check`, then compares the
PR against its exact base SHA. Pushes compare against the previous commit. New or
changed Changesets must cover every affected package; an unrelated pending entry
cannot satisfy a PR's release intent. A versioned release commit can satisfy the
bump directly. #8 will replace the Changesets input adapter with Nx Release while
retaining the compatibility classifier and migration checks as independent gates.

Do not edit generated files. Regenerate after source, package version, dependency
or generator changes, inspect the diff, then run checks. The loader rejects stale
builds using a canonical source-byte inventory recorded by `yarn build`.

## Artifacts and identity

Each package explicitly exports `./openapi/<domain>-review.json`, its YAML sibling,
`./openapi/inventory.json` and `./manifest.json`. These files are packed and checked
from clean installed consumers; importing the runtime package does not load them.
Their review status is part of the artifact, not permission to publish or deploy.

The aggregate lives under [generated/](../generated/contract-manifest.json).
Its build identity is a digest, not a shared SemVer version. Manifests record
independent package versions, exact Zod/tool dependencies, generator hashes,
schema origins and input/output views, profile requirements, exclusion reasons,
release blockers and artifact SHA-256 digests. Arrays retain semantic ordering;
object keys, operations and component IDs have deterministic ordering. JSON and
YAML describe exactly the same value.

The source revision is a `sha256:` content revision backed by named source-file
hashes. This avoids the impossible self-reference of embedding a commit SHA in
files committed by that same commit. It is not a claim about Git ancestry or npm
provenance. #8 must bind these content digests to the immutable release commit/tag
and published integrity in its publication attestation. No timestamp, build path
or machine-specific value enters the artifacts.

Component names derive from package-owned schema IDs, with `.Input`/`.Output`
views. A parameter referencing a property of a registered schema gets a stable
catalog-derived node ID. Recursive local references are relocated beneath the
component; remote resolution, unknown references, undeclared cross-domain
dependencies, duplicate IDs and ambiguous routes fail. Zod conversion is pinned
to 4.5.0; updating it requires re-auditing the isolated graph inspection.

## Profiles and release mode

An explicit profile provides `id`, `description`, `capabilities`,
`securityBindings`, `securitySchemes`, `hostBindings`, and review status/evidence.
Required host binding keys are listed in generated manifests. Each binding needs
a description and evidence link; no secret value belongs in a profile. Bindings
resolve host transport and behavior, never replace schemas or remove obligations.

The generator validates named security alternatives, preserves AND/OR semantics,
forbids anonymous alternatives on protected operations, and emits explicit
`security: []` only for authored public operations. Disabled capabilities are
omitted. Header presence/cardinality, repeated Set-Cookie, raw-byte verification
and operation semantics remain explicit extensions because an apiKey declaration
alone cannot express these requirements.

```sh
yarn openapi:release approved-profile.json /tmp/new-contract-artifacts
```

Release mode requires approved profile evidence, resolved host bindings, no
selected release blockers, and faithful schema conversion. It refuses all current
projection exceptions even if a caller changes the profile status to approved.
It generates and validates everything before writing to a new output directory.
No npm publish, GitHub release or deployment is performed. Until the proposal and
profiles are resolved, this command is expected to fail for affected capabilities.

## Compatibility policy

[baseline-comparison.json](../generated/baseline-comparison.json) checks all 29
routes, operation IDs, success statuses and tags against #3 and records discrepancy
and fixture evidence. D01 fills the three JWT documentation gaps; D02's obsolete
route stays absent. The report records structural identities, not a blanket
equivalence verdict. Existing differential tests, frozen HTTP tests, supplemental
probes and the new generated-response checks remain separate evidence.

Subsequent generated inventories are compared against the exact Git base. Removal,
renaming, changed schema constraints in either direction, responses, headers,
security, capabilities and semantics are conservatively breaking. Canonical
source changes are also conservatively breaking until reviewed because a changed
parser or inferred type can leave OpenAPI unchanged. Added operations/schema IDs
or additive exports require minor; compatible prose/artifact changes require patch.
This classifier intentionally permits false positives rather than pretending to
prove arbitrary schema-language inclusion or behavioral equivalence.

Breaking changes require major after 1.0, a new minor line before 1.0, and an
explicit approved migration record at `tools/openapi/migrations/<domain>.json`.
The record binds `package`, exact `baseRevision`, `findingsDigest`, `status`,
`owner`, `decision`, `consumerMigration` and `rollback`. CI checks that the record
matches the findings; maintainers still review approval provenance. A bump alone
never authorizes a security or wire change. No migrations are approved in #7.

## Tool references

- [Zod JSON Schema conversion](https://zod.dev/json-schema): use the pinned local
  version; living documentation may describe a newer release.
- [OpenAPI 3.1.1 specification](https://spec.openapis.org/oas/v3.1.1.html).
- [Swagger Parser validation](https://apidevtools.com/swagger-parser/): offline
  validation with external reference loading disabled, plus repository invariants.
