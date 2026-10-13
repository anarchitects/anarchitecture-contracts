# Anarchitecture Contracts

The independent home for Anarchitects public HTTP contracts, governed by
[Meta ADR-0012](https://github.com/anarchitects/anarchitecture-meta/blob/main/adr/0012-canonical-public-api-contract-ownership.md).
Contract packages will own Zod wire schemas, operation metadata and deterministic
OpenAPI 3.1 artifacts consumed by Bricks 3-tier, Bricks DDD and API clients.

## Current state

The workspace foundation (#2) and the
[frozen legacy 3-tier baseline](baselines/legacy-3tier/README.md) (#3) support
[EPIC #1](https://github.com/anarchitects/anarchitecture-contracts/issues/1).
The baseline inventories 29 operations and records 123 HTTP scenarios, legacy
OpenAPI artifacts, consumer dependencies and migration decisions requiring review.
There are **no published contracts or consumer adoption claims yet**.
The legacy evidence is not the canonical Zod contract source. Meta's ownership
decision is accepted; publication and verified migration remain separate gates.

[Accepted ADR-0002](adr/0002-domain-contract-authoring-and-publishing-boundaries.md)
completes the #4 design: four independently versioned domain packages, Zod-first
schemas and inferred types, explicit HTTP operations, dual ESM/CommonJS packaging
and compatibility/release boundaries. Issue #5 implements the unreleased
[Auth](packages/auth/README.md) and [Identity](packages/identity/README.md)
packages: 21 operations with inferred types and compatibility tests.
Issue #6 adds [Forms](packages/forms/README.md) and
[Newsletter](packages/newsletter/README.md), completing the 29-operation inventory.
Forms security dispositions and request-generation/profile gaps remain explicit
release gates; no stable capability or deployment adoption is implied.

Issue #7 adds [OpenAPI generation and compatibility checks](docs/openapi.md),
including 29-operation diagnostic inventories, JSON/YAML review artifacts,
package manifests and CI release-plan checks. The
[scoped projection register](docs/openapi-projection-proposal.md) implements the accepted
decision for #7. Real host bindings remain unresolved; artifacts are not deployable profiles.

Before writing code, read [AGENTS.md](AGENTS.md), every Meta and local ADR, and
the relevant engineering guides.

## Development

Use Node 24 (`.nvmrc`) and Yarn 4.18.1, pinned in `package.json`.
With Corepack available:

```sh
corepack enable
yarn install --immutable
yarn check
```

If your Node distribution omits Corepack, install it using the
[Corepack instructions](https://github.com/nodejs/corepack#manual-installs) first.

`yarn check` runs formatting/lint, offline baseline checks, package builds,
Zod/AJV differential fixtures, deterministic OpenAPI/lint/snapshot checks and
clean packed ESM/CommonJS/type/browser checks.
`yarn format` fixes formatting, excluding frozen artifact bytes.
CI runs the same checks, an immutable install and Nx release dry-run validation with
full Git history on pull requests and pushes to `main`. Actual legacy HTTP replay
is available with `yarn baseline:verify ../anarchitecture-bricks-3tier`; see its
[prerequisites and limits](baselines/legacy-3tier/README.md#reproduce).
CI also runs packed consumers on Node 22 and 24. Independent deployment
conformance and publication remain #8; approved host profiles remain a release gate.

Nx 23.3.0 and `@nx/js` provide per-package builds and inferred typechecks.
Use `yarn nx show projects`, `yarn nx graph` and `yarn nx run auth-contracts:build`
to inspect or run the graph. `yarn release:plan` records per-project release intent;
`yarn release:dry-run` previews the initial independent releases without publication.
Root scripts delegate to Nx targets. Manual release and tag-based publication use
the [Community-style workflows](docs/releases.md#workflow-operation), with current
host-profile blockers enforced before publication.
See the [migration record](docs/nx-migration.md) for preserved Changesets intent
and the remaining #8 gates. No Nx Cloud account is needed.

## Layout

| Path                            | Purpose                                                      |
| ------------------------------- | ------------------------------------------------------------ |
| `adr/`                          | Local architecture decisions                                 |
| `packages/`                     | Four independent contract workspaces and domain conventions  |
| `.nx/version-plans/`            | Package-level version and changelog configuration            |
| `docs/releases.md`              | Publication conventions, compatibility and adoption gates    |
| `docs/schema-authoring.md`      | Zod schema, inferred type and normalization conventions      |
| `docs/operation-definitions.md` | HTTP metadata, security profiles and generation requirements |
| `docs/baseline-dispositions.md` | Migration decisions and extraction/release blockers          |
| `baselines/legacy-3tier/`       | Frozen legacy evidence and migration discrepancy register    |
| `tools/legacy-baseline/`        | Offline evidence checks and optional source HTTP replay      |
| `tools/contract-authoring/`     | Shared authoring type, builds and compatibility checks       |
| `tools/openapi/`                | Generation, validation and package compatibility gates       |
| `generated/`                    | Aggregate review artifacts and baseline comparison           |
| `.github/workflows/ci.yml`      | Workspace/package checks; no publishing                      |

The workspace root is private. Runtime contract packages will not depend on
Nest, Fastify, Express, Angular, Nx or either Bricks implementation. Domain models
and business logic remain in their owning bounded contexts.

## Next delivery steps

1. Obtain approved real host profiles and conformance evidence; preserve Forms D05/D08 blockers.
2. [#8](https://github.com/anarchitects/anarchitecture-contracts/issues/8): publish verified packages and independent conformance tooling.

See [ADR-0001](adr/0001-contract-workspace-and-release-foundations.md),
[ADR-0002](adr/0002-domain-contract-authoring-and-publishing-boundaries.md),
[package conventions](packages/README.md) and [release conventions](docs/releases.md).

## License

[MIT](LICENSE).

## Nx workspace and release preparation

[ADR-0003](adr/0003-nx-workspace-and-release-governance.md) establishes Nx/`@nx/js`
for repository tooling and Nx Release as the sole versioning authority. The
workspace migration and version-plan transfer are implemented; signed release,
trusted npm publication and independent conformance delivery remain under #8.
Released contracts and conformance tools must remain usable without Nx.
