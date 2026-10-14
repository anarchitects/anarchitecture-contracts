# Agent instructions

## Required architecture review

Before generating, editing or refactoring **any code**, including generated code,
templates, examples, tests and migrations:

1. Enumerate and read **all ADRs** in this repository's `adr/**`, `docs/adr/**`
   and any additional documented ADR directories. Currently `adr/` is the only
   local ADR directory.
2. Enumerate and read **all Meta ADRs** in
   [anarchitects/anarchitecture-meta/adr](https://github.com/anarchitects/anarchitecture-meta/tree/main/adr).
   A current sibling checkout at `../anarchitecture-meta/adr/` is acceptable;
   record the reviewed revision and check relevant upstream changes. Otherwise
   use GitHub. Do not assume that reading only ADR-0012 is sufficient.
3. Review accepted, proposed, historical and superseded decisions. Obey accepted
   decisions; explicitly report applicable proposals and conflicts before
   implementation. A proposal never silently overrides an accepted ADR. If ADRs
   are unavailable, report the access blocker and do not begin code generation.
4. Read relevant engineering guides, [package conventions](packages/README.md)
   and [release rules](docs/releases.md). For public API changes, also read the
   applicable canonical contract/version, frozen baseline and compatibility rules.
   The accepted #4 design includes [schema authoring](docs/schema-authoring.md),
   [operation definitions](docs/operation-definitions.md) and
   [baseline dispositions](docs/baseline-dispositions.md); read these before
   extracting or changing contract packages.
   Re-check this review when scope or evidence changes.

## Boundaries

- This repository owns public HTTP wire schemas, operation metadata, generated
  OpenAPI 3.1, compatibility fixtures and independent conformance tooling.
- Author schemas once in Zod and infer TypeScript types. Generate OpenAPI;
  never separately maintain generated output as an editable source of truth.
- Keep contract runtime packages independent of Nest, Fastify, Express, Angular,
  Nx, and both Bricks implementations. Consumers depend on immutable contract
  artifacts; contracts must not import implementation code.
- Domain models, invariants and application ports stay in their bounded contexts.
  `@anarchitects/auth-ts` retains authorization-policy semantics and evaluation
  conformance; HTTP representations must map without lossy duplication.
- Audit existing TypeBox schemas, generated specs and actual HTTP behavior before
  extraction. Preserve wire compatibility unless a separately reviewed versioned
  migration explicitly changes it. Never claim adoption from package existence.

## Working and validating

Use Node 24 and the Yarn version pinned in `package.json`. Commit `yarn.lock` when
dependencies change; use `yarn install --immutable` in clean checkouts and CI.
Run `yarn check` before handing off work and `yarn format` to fix formatting.
Keep build tools and framework integrations out of contract runtime dependencies.

Auth, Forms, Identity and Newsletter now have runtime packages. Maintain meaningful
package build, type, compatibility, packed-consumer and behavioral checks as
packages evolve;
do not add placeholder checks that claim conformance without exercising it.
Keep each epic subissue in a separate PR and report validation gaps accurately.

## Canonical publication and host conformance

[Accepted ADR-0005](adr/0005-independent-contract-publication-and-implementation-conformance.md)
separates contract validity, implementation conformance and deployment compliance.
Use [the generation guide](docs/openapi.md): canonical packages are publishable
without a host after contract checks; publication never proves implementation
support. Format-2 canonical manifests must retain empty supported capabilities,
unverified host/deployment states, unresolved bindings and known limitations.
Generate artifacts from sources; never edit manifest statuses or copy host output
into a package to bypass validation. Regeneration after Nx versioning must preserve
canonical mode. Existing review exports remain diagnostic, not deployment profiles.

P07 remains operation/source/generator-pinned; no broad exceptions or anonymous
fallbacks. Real host profiles require strict approval, exact-version runtime
security/conformance evidence and resolved bindings. Synthetic evidence stays
unverified. D05/D08 remain Forms host-conformance blockers; never canonize unsafe
legacy behavior or claim support without separately reviewed migration/remediation.
They do not block unrelated canonical publication.

## Nx Release migration in progress

[ADR-0003](adr/0003-nx-workspace-and-release-governance.md) requires Nx tooling;
[accepted ADR-0004](adr/0004-package-initial-release-and-nx-versioning.md) makes
Nx Conventional Commits the sole ongoing version-bump authority. Do not create
or consume version plans. Preserve the historical rationale in
[the migration record](docs/nx-migration.md); never reintroduce a second versioner.

Before first distribution, use `init(<exact-nx-project-name>): ...` for package
work; initialization never bumps. Explicit first release is exactly `0.0.1`.
After distribution (including `0.0.x`), use normal Conventional Commits; never
use `init` to hide released changes. Split commits touching different lifecycle
states. All scopes must exist in the active Nx project graph; repository-wide
work may be unscoped. Every allowed type must have an explicit Nx bump mapping.
Validate commit ranges and PR squash titles with `yarn commits:check <base-ref>`.

Run `yarn test:release` and package compatibility checks when release tooling
changes. Contract-impact gates must validate the actual Nx-derived version and
retain pinned migration approval for breaks. First-release and publication
checks must inspect distribution history, not only the local manifest version.

Issue #20 corrects the #8 publication prerequisite. Live signed release verification,
trusted publication and downstream clean-install evidence remain external work.
Standalone HTTP conformance and host evidence belong to downstream claims; they
are not prerequisites for canonical publication. Review-only/test-only artifacts
still fail the canonical publication gate. Never remove a host capability blocker
or treat a dry run as deployment approval.
Contract runtimes and the standalone conformance CLI must not acquire Nx as a dependency.
