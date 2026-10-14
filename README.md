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
host-conformance gates; canonical publication implies no implementation support.

Issue #7 adds [OpenAPI generation and compatibility checks](docs/openapi.md),
including 29-operation inventories, canonical and diagnostic JSON/YAML artifacts,
package manifests and CI compatibility checks. The
[scoped projection register](docs/openapi-projection-proposal.md) implements the accepted
decision for #7. Real host bindings remain unresolved; artifacts are not deployable profiles.

Before writing code, read [AGENTS.md](AGENTS.md), every Meta and local ADR, and
the relevant engineering guides.

[Accepted ADR-0005](adr/0005-independent-contract-publication-and-implementation-conformance.md)
implements [#20](https://github.com/anarchitects/anarchitecture-contracts/issues/20):
**contract validity ≠ implementation conformance ≠ deployment compliance**.
Canonical packages can be published before a Bricks implementation exists. Their
manifests claim no supported host capabilities. Protected operations remain in
the canonical inventory with explicit security obligations; unresolved bindings
never become anonymous OpenAPI paths. Hosts independently prove their support.

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
conformance remains host-owned. ADR-0005 separates it from canonical publication.

Nx 23.3.0 and `@nx/js` provide per-package builds and inferred typechecks.
Use `yarn nx show projects`, `yarn nx graph` and `yarn nx run auth-contracts:build`
to inspect or run the graph. `yarn commits:check <base-ref>` validates Conventional Commits and Nx scopes;
`yarn release:dry-run` previews the initial independent releases without publication.
Root scripts delegate to Nx targets. Manual release and tag-based publication use
the [Community-style workflows](docs/releases.md#workflow-operation), with current
contract validity and integrity checks enforced before publication.
See the [migration record](docs/nx-migration.md) for preserved Changesets intent
and the remaining #8 gates. No Nx Cloud account is needed.

## Layout

| Path                            | Purpose                                                      |
| ------------------------------- | ------------------------------------------------------------ |
| `adr/`                          | Local architecture decisions                                 |
| `packages/`                     | Four independent contract workspaces and domain conventions  |
| `docs/release-history/`         | Archived release rationale; never an executable bump input   |
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

1. Complete external signing/npm setup and review the first canonical `0.0.1` publication.
2. Bricks consumes immutable packages and supplies actual HTTP conformance evidence.
3. Hosts resolve deployment profiles; Forms D05/D08 remain blockers for affected claims.

See [ADR-0001](adr/0001-contract-workspace-and-release-foundations.md),
[ADR-0002](adr/0002-domain-contract-authoring-and-publishing-boundaries.md),
[package conventions](packages/README.md) and [release conventions](docs/releases.md).

## License

[MIT](LICENSE).

## Nx workspace and release preparation

[ADR-0003](adr/0003-nx-workspace-and-release-governance.md) establishes Nx/`@nx/js`
for repository tooling and Nx Release as the sole versioning authority. The
workspace migration and Conventional Commit versioning are implemented; signed release,
trusted npm publication and independent conformance delivery remain under #8.
Released contracts and conformance tools must remain usable without Nx.
