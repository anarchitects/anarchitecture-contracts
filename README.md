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
There are **no public contract packages or consumer adoption claims yet**.
The legacy evidence is not the canonical Zod contract source. Meta's ownership
decision is accepted; publication and verified migration remain separate gates.

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

`yarn check` runs Prettier, Markdown lint and offline baseline evidence checks.
`yarn format` fixes formatting, excluding frozen artifact bytes.
CI runs the same checks, an immutable install and `yarn changeset:status` with
full Git history on pull requests and pushes to `main`. Actual legacy HTTP replay
is available with `yarn baseline:verify ../anarchitecture-bricks-3tier`; see its
[prerequisites and limits](baselines/legacy-3tier/README.md#reproduce).
Contract builds and independent consumer conformance checks arrive with their
implementation issues.

Changesets status needs a committed `HEAD` and a fetched `origin/main` base.

## Layout

| Path                       | Purpose                                                        |
| -------------------------- | -------------------------------------------------------------- |
| `adr/`                     | Local architecture decisions                                   |
| `packages/`                | Future independent contract workspaces; conventions only today |
| `.changeset/`              | Package-level version and changelog configuration              |
| `docs/releases.md`         | Publication conventions, compatibility and adoption gates      |
| `baselines/legacy-3tier/`  | Frozen legacy evidence and migration discrepancy register      |
| `tools/legacy-baseline/`   | Offline evidence checks and optional source HTTP replay        |
| `.github/workflows/ci.yml` | Foundation checks; no publishing                               |

The workspace root is private. Runtime contract packages will not depend on
Nest, Fastify, Express, Angular, Nx or either Bricks implementation. Domain models
and business logic remain in their owning bounded contexts.

## Next delivery steps

1. [#4](https://github.com/anarchitects/anarchitecture-contracts/issues/4): define domain package boundaries and schema/operation conventions using the legacy audit.
2. [#5](https://github.com/anarchitects/anarchitecture-contracts/issues/5) and [#6](https://github.com/anarchitects/anarchitecture-contracts/issues/6): extract audited contracts and resolve the recorded migration decisions.
3. [#7](https://github.com/anarchitects/anarchitecture-contracts/issues/7): deterministic OpenAPI and compatibility gates.
4. [#8](https://github.com/anarchitects/anarchitecture-contracts/issues/8): publish verified packages and independent conformance tooling.

See [ADR-0001](adr/0001-contract-workspace-and-release-foundations.md),
[package conventions](packages/README.md) and [release conventions](docs/releases.md).

## License

[MIT](LICENSE).
