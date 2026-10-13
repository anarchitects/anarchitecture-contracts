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
Forms/Newsletter extraction follows in #6.

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
Zod/AJV differential fixtures and clean packed ESM/CommonJS/type/browser checks.
`yarn format` fixes formatting, excluding frozen artifact bytes.
CI runs the same checks, an immutable install and `yarn changeset:status` with
full Git history on pull requests and pushes to `main`. Actual legacy HTTP replay
is available with `yarn baseline:verify ../anarchitecture-bricks-3tier`; see its
[prerequisites and limits](baselines/legacy-3tier/README.md#reproduce).
CI also runs packed consumers on Node 22 and 24. Independent deployment
conformance and publication remain #8; OpenAPI generation remains #7.

Changesets status needs a committed `HEAD` and a fetched `origin/main` base.

## Layout

| Path                            | Purpose                                                      |
| ------------------------------- | ------------------------------------------------------------ |
| `adr/`                          | Local architecture decisions                                 |
| `packages/`                     | Auth/Identity workspaces and future domain conventions       |
| `.changeset/`                   | Package-level version and changelog configuration            |
| `docs/releases.md`              | Publication conventions, compatibility and adoption gates    |
| `docs/schema-authoring.md`      | Zod schema, inferred type and normalization conventions      |
| `docs/operation-definitions.md` | HTTP metadata, security profiles and generation requirements |
| `docs/baseline-dispositions.md` | Migration decisions and extraction/release blockers          |
| `baselines/legacy-3tier/`       | Frozen legacy evidence and migration discrepancy register    |
| `tools/legacy-baseline/`        | Offline evidence checks and optional source HTTP replay      |
| `tools/contract-authoring/`     | Shared authoring type, builds and compatibility checks       |
| `.github/workflows/ci.yml`      | Workspace/package checks; no publishing                      |

The workspace root is private. Runtime contract packages will not depend on
Nest, Fastify, Express, Angular, Nx or either Bricks implementation. Domain models
and business logic remain in their owning bounded contexts.

## Next delivery steps

1. [#6](https://github.com/anarchitects/anarchitecture-contracts/issues/6): extract Forms/Newsletter and resolve their migration decisions.
2. [#7](https://github.com/anarchitects/anarchitecture-contracts/issues/7): deterministic OpenAPI and compatibility gates.
3. [#8](https://github.com/anarchitects/anarchitecture-contracts/issues/8): publish verified packages and independent conformance tooling.

See [ADR-0001](adr/0001-contract-workspace-and-release-foundations.md),
[ADR-0002](adr/0002-domain-contract-authoring-and-publishing-boundaries.md),
[package conventions](packages/README.md) and [release conventions](docs/releases.md).

## License

[MIT](LICENSE).
