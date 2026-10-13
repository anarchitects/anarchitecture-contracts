# OpenAPI generation and compatibility gates

Issue #7 adds deterministic OpenAPI 3.1.1 JSON/YAML generation directly from the
four canonical Zod catalogs and operation registries. Legacy TypeBox and upstream
OpenAPI are comparison evidence only. The generator imports no Bricks runtime,
boots no server, and never reads the baseline while producing schemas or paths.

**Current artifacts are review-only.** The
[scoped projection register](openapi-projection-proposal.md) implements the accepted
decision; real host security/behavior bindings remain unresolved. All 29 operations appear
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
changed Nx version plans must cover every affected package; an unrelated pending entry
cannot satisfy a PR's release intent. A versioned release commit can satisfy the
bump directly. #8 replaces the Changesets input adapter with Nx version plans while retaining
the compatibility classifier and migration checks as independent gates. Mechanical
plan migration cannot count as new release intent against a pre-cutover base.

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

The strict input schema is `ResolvedProfileSchema` in
[profiles.mjs](../tools/openapi/profiles.mjs). Profiles contain no runtime imports
or credentials. They select explicit domain `variants` (such as `auth.session`,
`auth.session-passkeys`, `auth.jwt-plugin` or `newsletter.subscription-webhook`)
and capabilities. Every enabled capability must be covered; every selected variant
must have all its capabilities enabled. All required bindings of those variants
must resolve, without undeclared extras.

A profile supplies named `securitySchemes` (cookie/header apiKey or bearer),
`securityBindings` containing explicit AND/OR alternatives, and `hostBindings`.
Each host binding has a description, JSON `configurationPointer` into the reviewed
host configuration and evidence case IDs. Secret bindings point to restricted
configuration; never put credentials into descriptions or artifacts.

`contractVersions` and `contractSource` pin exact packages and canonical source
bytes. `host` identifies its repository, immutable revision and configuration hash.
`evidence` binds those values and a digest of the complete selected profile,
including transports, capabilities, variants and binding references. Its test
rows identify operation, obligation, result, HTTP status and immutable evidence
URL plus its `artifactDigest`. `approval` records owner, decision URL and the digest of those evidence bytes.
Changing bindings, versions, configuration or report bytes invalidates the gate.

The input is a reviewed attestation, not self-authenticating proof: digests bind
bytes but cannot establish who ran a test or whether a report is truthful. Host
maintainers must verify linked report bytes against artifact digests and approval provenance in
review. The offline generator neither downloads evidence nor grants approval.
It rejects incomplete attestations, nonpassing cases, unrelated binding evidence,
missing outcomes/fixtures/semantic obligations and missing security negatives.

Protected operations never gain an anonymous alternative. AND within each object
and OR between objects are preserved exactly; webhook alternatives must all require
the authored signature header. Authenticated/resource-ownership failures, raw-byte
mutation and missing signatures, body limits, declared error statuses and header
cardinality are required evidence. Raw-byte verification, rate limiting, consent,
cookie forwarding and authorization remain normative operation semantics.

```sh
yarn openapi:release approved-profile.json /tmp/new-contract-artifacts
node tools/openapi/cli.mjs verify-profile synthetic-profile.json /tmp/new-test-artifacts
```

Release requires `status: approved`, `evidence.kind: host-runtime`, resolved
bindings, no selected capability blockers, and faithful conversion or exact scoped
P07 reviews. `verify-profile` exercises the same structural, evidence and projection
gates with `status: test-fixture` and `evidence.kind: synthetic`. Its artifacts are
`test-only`, always have `supportedCapabilities: []`, and retain host blockers.
Merely relabeling a synthetic profile approved cannot release it. The executable
[synthetic fixture builder](../tools/openapi/fixtures/synthetic-profile.mjs) creates
protocol test data only; it cannot produce host-runtime reports.

Both commands generate and validate everything before writing a new directory;
a failed gate leaves no output. Neither publishes nor deploys. Forms D05/D08 block
the selected capability in both modes. Diagnostic generation can retain all legacy
operations in inventories, including their limitations and unresolved bindings.

Manifests preserve outstanding capability-level host blockers and D05/D08 even
when a capability is disabled. Auth/Identity evidence is tracked by Bricks #488;
Forms/Newsletter adoption by #489, with D05/D08 specifically owned there; #490
owns conformance integration and DDD #23 tracks the other implementation family.
Contracts #8 owns packaging/publication. None of these outstanding host tasks
prevents closing #7 once its mechanisms and tests are complete.

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
never authorizes a security or wire change. The #7 records cover generator corrections and additive Forms migration targets;
they do not authorize an unimplemented runtime wire or security change.

## Tool references

- [Zod JSON Schema conversion](https://zod.dev/json-schema): use the pinned local
  version; living documentation may describe a newer release.
- [OpenAPI 3.1.1 specification](https://spec.openapis.org/oas/v3.1.1.html).
- [Swagger Parser validation](https://apidevtools.com/swagger-parser/): offline
  validation with external reference loading disabled, plus repository invariants.
