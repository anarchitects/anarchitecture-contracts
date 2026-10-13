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

## OpenAPI review artifacts

Use [the generation guide](docs/openapi.md) for #7 commands and compatibility gates.
Current generated OpenAPI and manifests are review-only while real host bindings
remain unresolved. [P07](docs/openapi-projection-proposal.md) now implements the
accepted #7 decision through source/generator-pinned, operation-scoped reviews.
Never broaden those reviews, infer deployment approval from synthetic evidence,
infer anonymous protection, or remove Forms D05/D08 blockers to make checks pass.
Issue #7's tested mechanism can complete independently of host remediation and #8
publication; preserve outstanding capability blockers in manifests.

## Nx Release migration in progress

[Accepted ADR-0003](adr/0003-nx-workspace-and-release-governance.md) supersedes the
initial no-Nx workspace and Changesets release authority. Nx 23.3.0 / `@nx/js` now
orchestrate builds and inferred typechecks. Nx Release version plans in
`.nx/version-plans/` are the sole release intent; use `yarn release:plan` for public
package changes. The [migration record](docs/nx-migration.md) preserves all pending
Changesets rationale and bump equivalence. Never reintroduce a second versioner.
Run `yarn test:release` and package compatibility checks when release tooling changes.

Issue #8 is not complete: signed release automation, standalone conformance,
trusted publication and downstream clean-install evidence remain required.
Current review-only manifests must continue to fail publication checks. Never
remove a capability blocker or treat a dry run as deployment approval.
Contract runtimes and the standalone conformance CLI must not acquire Nx as a dependency.
