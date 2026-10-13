# Anarchitecture Contracts

The independent home for Anarchitects public HTTP contracts, governed by
[Meta ADR-0012](https://github.com/anarchitects/anarchitecture-meta/blob/main/adr/0012-canonical-public-api-contract-ownership.md).
Contract packages will own Zod wire schemas, operation metadata and deterministic
OpenAPI 3.1 artifacts consumed by Bricks 3-tier, Bricks DDD and API clients.

## Current state

This is the workspace foundation for
[issue #2](https://github.com/anarchitects/anarchitecture-contracts/issues/2), part of
[EPIC #1](https://github.com/anarchitects/anarchitecture-contracts/issues/1).
There are **no public contract packages, generated API artifacts or consumer
adoption claims yet**. Meta's ownership decision is accepted; implementation,
publication and verified consumer migration are separate gates.

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

`yarn check` runs Prettier and Markdown lint. `yarn format` fixes formatting.
CI runs the same checks, an immutable install and `yarn changeset:status` with
full Git history on pull requests and pushes to `main`. These checks validate the foundation;
contract builds, compatibility and HTTP conformance checks arrive with their
implementation issues.

Changesets status needs a committed `HEAD` and a fetched `origin/main` base. For the
initial empty repository, a maintainer must first create and push an empty base
commit on `main`, then commit these foundation files on a feature branch to open
the issue #2 PR. Local formatting and lint checks work before that bootstrap.

## Layout

| Path                       | Purpose                                                        |
| -------------------------- | -------------------------------------------------------------- |
| `adr/`                     | Local architecture decisions                                   |
| `packages/`                | Future independent contract workspaces; conventions only today |
| `.changeset/`              | Package-level version and changelog configuration              |
| `docs/releases.md`         | Publication conventions, compatibility and adoption gates      |
| `.github/workflows/ci.yml` | Foundation checks; no publishing                               |

The workspace root is private. Runtime contract packages will not depend on
Nest, Fastify, Express, Angular, Nx or either Bricks implementation. Domain models
and business logic remain in their owning bounded contexts.

## Next delivery steps

1. [#3](https://github.com/anarchitects/anarchitecture-contracts/issues/3): audit and freeze actual 3-tier wire behavior.
2. [#4](https://github.com/anarchitects/anarchitecture-contracts/issues/4): define domain package boundaries and schema/operation conventions.
3. [#5](https://github.com/anarchitects/anarchitecture-contracts/issues/5) and [#6](https://github.com/anarchitects/anarchitecture-contracts/issues/6): extract audited contracts.
4. [#7](https://github.com/anarchitects/anarchitecture-contracts/issues/7): deterministic OpenAPI and compatibility gates.
5. [#8](https://github.com/anarchitects/anarchitecture-contracts/issues/8): publish verified packages and independent conformance tooling.

See [ADR-0001](adr/0001-contract-workspace-and-release-foundations.md),
[package conventions](packages/README.md) and [release conventions](docs/releases.md).

## License

[MIT](LICENSE).
