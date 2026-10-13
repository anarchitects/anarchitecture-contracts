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

This foundation has no runtime packages. Add meaningful package build, type,
compatibility, packed-consumer and behavioral checks as those packages arrive;
do not add placeholder checks that claim conformance without exercising it.
Keep each epic subissue in a separate PR and report validation gaps accurately.
