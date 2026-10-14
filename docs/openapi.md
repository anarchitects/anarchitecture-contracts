# OpenAPI generation and compatibility gates

Issue #7 adds deterministic OpenAPI 3.1.1 JSON/YAML generation directly from the
four canonical Zod catalogs and operation registries. Legacy TypeBox and upstream
OpenAPI are comparison evidence only. The generator imports no Bricks runtime,
boots no server, and never reads the baseline while producing schemas or paths.

[ADR-0005](../adr/0005-independent-contract-publication-and-implementation-conformance.md)
separates canonical publication from host support. Default generation produces
**canonical contract artifacts**, with retained diagnostic review JSON/YAML.
All 29 operations appear in the canonical inventory. Only the 14 explicitly public
operations appear in canonical OpenAPI paths; the 15 protected operations remain
excluded with explicit security obligations, never silently declared public.
Canonical OpenAPI is not a complete deployment/client-generation profile.
Forms D05/D08 remain host-conformance blockers, not package-publication blockers.

## Commands and CI

```sh
yarn openapi:generate                # build, generate and lint canonical artifacts
yarn openapi:check                   # fail on byte drift; never rewrite files
yarn test:openapi                    # snapshots, mutation and compatibility tests
yarn openapi:compatibility origin/main # package-aware PR release-version gate
yarn check                          # full workspace, contract and package checks
```

CI runs generation verification and tests through `yarn check`, then compares the
PR against its exact base SHA. Pushes compare against the previous commit.
The repository's Nx adapter obtains actual proposed versions from Nx Release's
public dry-run API. Independent compatibility functions consume these versions
without importing Nx. Insufficient bumps fail; changing a manifest manually is
not release intent. Explicit initial release uses `0.0.1`, while unreleased
`init` development remains at `0.0.0`. Neither exemption waives baseline checks
or matching migration approval for breaks. Release preparation also checks the
cumulative delta against the last package tag. Publication validates the signed,
tagged version against that same baseline.

Do not edit generated files. Regenerate after source, package version, dependency
or generator changes, inspect the diff, then run checks. The loader rejects stale
builds using a canonical source-byte inventory recorded by `yarn build`.

## Artifacts and identity

Each package explicitly exports `./openapi/<domain>-canonical.json` and its YAML
sibling, the retained diagnostic `./openapi/<domain>-review.json`/YAML exports,
`./openapi/inventory.json` and `./manifest.json`. These files are packed and checked
from clean installed consumers; importing the runtime package does not load them.
Canonical publication validates these artifacts without asserting host support.
The diagnostic review exports remain explicitly review-only and nondeployable.

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

## Manifest format 2 and independent gates

| Field                              | Canonical package    | Approved host artifact | Synthetic host artifact |
| ---------------------------------- | -------------------- | ---------------------- | ----------------------- |
| `artifactKind`                     | `canonical-contract` | `host-resolved`        | `host-test`             |
| `status`                           | `canonical`          | `resolved`             | `test-only`             |
| `contractPublication.status`       | `validated`          | `not-applicable`       | `not-applicable`        |
| `implementationConformance.status` | `unverified`         | `verified`             | `unverified`            |
| `deploymentCompliance.status`      | `unverified`         | `verified`             | `unverified`            |
| `supportedCapabilities`            | Empty                | Evidence-backed subset | Empty                   |

`validated` covers source/operation/projection and artifact validity, not a claim
that a registry publication has happened. Gate A also requires build/type/behavior,
packed consumers, compatibility/migration and release integrity/provenance checks.
It regenerates package artifacts and compares exact bytes; editing a manifest
status or its hashes cannot grant eligibility.

Canonical `hostConformanceBlockers`, `capabilityBlockers`, `releaseBlockers` and
`unresolvedHostBindings` remain disclosed. `blockerScope` identifies them as
implementation/deployment restrictions. Retained legacy blocker fields are for
consumer continuity, not a canonical publication veto. Forms legacy response
schemas remain migration evidence; the normative D08 obligation requires the safe
public DTO before a host can claim support. P07 projections are unchanged.

Consumers must recognize format 2 and artifact kind before interpreting statuses.
The canonical inventory retains every operation, schema view and security/behavior
obligation. `x-contract-security-obligations` exposes normative security in the
OpenAPI document; `x-contract-deployment-ready: false` and explicit exclusions
prevent treating it as a host profile. No placeholder auth transport is invented.

`artifacts.mjs` composes canonical metadata around the unchanged, P07-pinned
projection engine. Its bytes are also included in generator identity. Existing
source/generator approval pins stay enforced without reissuing or broadening reviews.
Default `write` and `check` modes always prepare/verify canonical package bytes,
including after Nx changes package versions. Host output goes to a separate directory
and is never copied over packaged manifests.

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

Host-resolved generation requires `status: approved`, `evidence.kind: host-runtime`, resolved
bindings, no selected capability blockers, and faithful conversion or exact scoped
P07 reviews. `verify-profile` exercises the same structural, evidence and projection
gates with `status: test-fixture` and `evidence.kind: synthetic`. Its artifacts are
`test-only`, always have `supportedCapabilities: []`, and retain host blockers.
Merely relabeling a synthetic profile approved cannot release it. The executable
[synthetic fixture builder](../tools/openapi/fixtures/synthetic-profile.mjs) creates
protocol test data only; it cannot produce host-runtime reports.

Both commands generate and validate everything before writing a new directory;
a failed gate leaves no output. Neither publishes nor deploys. Live host generation requires versions at least
`0.0.1`; maintainers must verify the exact referenced packages were distributed.
Offline generation validates attestations, not registry existence or report truth. Forms D05/D08 block
the selected capability in both modes. Diagnostic generation can retain all legacy
operations in inventories, including their limitations and unresolved bindings.

Manifests preserve outstanding capability-level host blockers and D05/D08 even
when a capability is disabled. Auth/Identity evidence is tracked by Bricks #488;
Forms/Newsletter adoption by #489, with D05/D08 specifically owned there; #490
owns conformance integration and DDD #23 tracks the other implementation family.
Contracts #8 owns packaging/publication. None of these outstanding host tasks
prevents closing #7 once its mechanisms and tests are complete.

## Compatibility policy

### Configured Auth requests

`createAuthContracts(config)` is the only authoring source for configured session
request schemas and operation bodies. A resolved host profile may include the
complete `authConfig` object. The generator replaces Auth session schemas using
that factory; JWT keeps its default login constraints. Without `authConfig`,
generation uses default schemas. The default package document must not be presented
as an exact description of a host with different validation rules.

Configured output includes `x-contract-auth-config` and the complete configuration
in its manifest profile. A virtual `configuration:auth` source hash binds P07
entries and host evidence to the exact configuration, including shaping metadata.
Changing configuration invalidates those reviews and evidence. The factory's
server validation does not implement Angular's `emptyStringPolicy` shaping.

After building, prepare **draft** projection records for a specific configuration:

```sh
node tools/openapi/review-candidates.mjs auth-config.json > /tmp/auth-projections.draft.json
```

Maintainers must review the exact source, generator, configuration and projection
limitations under P07. Drafts are not approvals. After that review, generate a
diagnostic variant into a new directory:

```sh
node tools/openapi/cli.mjs configured-review auth-config.json reviewed-projections.json /tmp/auth-configured-review
```

This mode is `review-only`: protected operations remain excluded from paths and
remain visible in inventory. It cannot establish host support. For a resolved
host, put the same configuration in the approved profile and supply its reviewed
register as the optional third argument:

```sh
yarn openapi:release approved-profile.json /tmp/auth-host reviewed-projections.json
```

All existing security, runtime-evidence and publication gates still apply.
`verify-profile` accepts the same optional register for synthetic test-only
evidence. No command rewrites the accepted register or package artifacts with
configured host output. An omitted register uses the default checked-in register,
which fails closed when its exact source/configuration/generator pins do not match.

### Change classification

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
or additive exports require minor after 1.0 and patch before 1.0; compatible
prose/artifact changes require patch.
This classifier intentionally permits false positives rather than pretending to
prove arbitrary schema-language inclusion or behavioral equivalence.

The shared P07 register digest is repository-wide provenance. A digest-only change
with a valid reviewed register identity/status and byte-identical package-local
reviews is a patch change to the distributed manifest, not a new exception or
breaking contract. An unchanged package manifest produces no finding. Changes to
local P07 review scope, source/generator pins or exception meaning remain strict;
register identity/status, normative schemas/operations/security and host approval
changes still require breaking review. Generated artifact bytes without a semantic
delta require patch. Generation and publication independently verify approval,
source/generator pins and exact artifact integrity; a patch classification grants
no permission to use stale reviews or unreviewed projections.

Breaking changes require major after 1.0, a new minor line before 1.0, and an
explicit approved migration record at `tools/openapi/migrations/<domain>.json`.
The file accepts one record or an array of records, so PR-base and cumulative
last-release reviews can coexist. Each record binds `package`, exact `baseRevision`, `findingsDigest`, `status`,
`owner`, `decision`, `consumerMigration` and `rollback`. CI checks that the record
matches the findings; exactly one record must match the package, revision and
findings digest. Missing, ambiguous, draft or incomplete matches fail closed.
Maintainers still review approval provenance. A bump alone
never authorizes a security or wire change. The #7 records cover generator corrections and additive Forms migration targets;
they do not authorize an unimplemented runtime wire or security change.

## Tool references

- [Zod JSON Schema conversion](https://zod.dev/json-schema): use the pinned local
  version; living documentation may describe a newer release.
- [OpenAPI 3.1.1 specification](https://spec.openapis.org/oas/v3.1.1.html).
- [Swagger Parser validation](https://apidevtools.com/swagger-parser/): offline
  validation with external reference loading disabled, plus repository invariants.
