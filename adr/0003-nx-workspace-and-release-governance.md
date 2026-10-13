# ADR-0003: Nx Workspace and Release Governance for Canonical Contracts

- **Status:** Accepted
- **Date:** 2026-10-13
- **Owners:** Architecture maintainers
- **Scope:** Contracts repository tooling, independent JS packages, versioning, release and npm publication
- **Implements:** [Contracts #8](https://github.com/anarchitects/anarchitecture-contracts/issues/8), under [EPIC #1](https://github.com/anarchitects/anarchitecture-contracts/issues/1)
- **Supersedes in part:** [ADR-0001](0001-contract-workspace-and-release-foundations.md) (no Nx for repository builds; Changesets as long-term release authority) and [ADR-0002](0002-domain-contract-authoring-and-publishing-boundaries.md) (Changesets-specific versioning mechanism)
- **Governing:** [Meta ADR-0012 — Canonical Public API Contract Ownership](https://github.com/anarchitects/anarchitecture-meta/blob/main/adr/0012-canonical-public-api-contract-ownership.md)

## Context

Contracts was bootstrapped in #2 as a minimal private Yarn 4 workspace with Changesets and no Nx requirement. ADR-0001 deliberately scoped this choice to the **foundation**; ADR-0002 subsequently established four independently released Zod-first packages and applied the then-current Changesets workflow. Existing package authoring, build, type, test and clean packed-consumer checks must not be discarded.

Bricks 3-Tier, Plugins and Community use Nx projects, Nx Release and dedicated GitHub release/publish workflows. Contracts must use the same maintainable workspace and delivery model without becoming dependent on either implementation repository, making Nx mandatory for *consumers*, or losing canonical Zod/OpenAPI/compatibility guarantees.

## Decision

### 1. Adopt Nx + `@nx/js` as repository tooling

1. Convert the existing Yarn 4/Node 24 monorepo into an Nx workspace; retain `packages/*`, package names and all published public contracts. Pin a compatible Nx/`@nx/js` toolchain and use supported Nx APIs and Project Crystal/inferred targets where appropriate.
2. Represent **every publishable contracts package** (initially Auth, Forms, Identity and Newsletter) as a distinct discoverable `@nx/js`-managed Nx project, with a package build, typecheck, test, packed-consumer verification and generated contract validation workflow. Use Nx project dependency/target graphs, correct inputs and outputs, and `^build` where justified. Non-publishable generators, CLI build tools and compatibility tasks may be separate private Nx projects.
3. Preserve deterministic canonical Zod schemas, type inference, first-class HTTP operation definitions, OpenAPI 3.1 generation, exact profile/version/digest metadata, ESM/CommonJS output, correct declarations, public subpath exports, package manifests, licenses and Node/browser compatibility. Nx is an **orchestrator**, not a reason to rewrite or duplicate those sources. Existing build tools may run underneath Nx targets where their artifact semantics are required.
4. Nx, `@nx/js` and any Nx Cloud service are **development-only**, never runtime, peer or transitive dependencies of released contract packages. The published contract packages and **standalone conformance CLI** must work from clean installations without Nx, Nest, Fastify, Express, Angular, or Bricks.
5. Nx Cloud/distributed agents, if used, are optional and explicitly configured; reproducible local and standard CI builds must remain possible without a paid or hidden external service.

### 2. Nx Release becomes the sole release authority

1. Adopt Nx Release for **independent package versions**, project-scoped tags (e.g. `auth-contracts@1.0.0`), conventional-commit-informed release planning, changelogs and GitHub Releases. Preserve package-scoped SemVer, meaningful release notes and controlled first/prerelease modes. The root workspace and tooling-only projects are **not publishable**.
2. The existing Changesets configuration and pending entries are **transitional artifacts**, not an endorsed second permanent release system. Before switching, inventory and transfer their unreleased package/version intent and changelog rationale, prove version equivalence, and remove Changesets scripts/config/CI validation as release authority. **Never let Changesets and Nx Release independently bump or publish the same package.**
3. Nx release planning does not override **semantic and security compatibility review**. A conventional `feat`/`fix` classification cannot authorize incompatible Zod parsing, HTTP wire contracts, operation IDs, public exports, status/errors/authentication/headers, generated OpenAPI, package runtime compatibility or policy DTO meaning. Major/breaking changes need independently reviewed migration and SemVer controls, including pre-1.0 disclosures.
4. Maintain explicit release-project allowlists, dependency-first ordering, accurately resolved published SemVer ranges for approved cross-domain dependencies, clean packed manifests, Git ancestry checks where useful, and separately versioned OpenAPI artifacts and immutable profile manifests.

### 3. Split release and publication workflows

1. Use **manual release from reviewed `main`** for `nx release ... --skip-publish`, with validated project/version/specifier/first-release inputs; this prepares release commits, tags, changelogs and GitHub Releases but does **not** publish npm packages.
2. Use a separate **publish** workflow triggered by an approved published GitHub Release and/or controlled manual tag replay. Check out the **immutable tag**, validate `<eligible-project>@<version>`, rebuild and typecheck, run tests and OpenAPI/compatibility verification, inspect npm pack output, and only then run scoped `nx release publish --projects <project> --yes`.
3. Prefer npm **trusted publishing/OIDC and provenance** with minimal GitHub permissions and concurrency/replay protections; verify configured npm organization permissions and trusted-publisher mappings before the first publication. Credentials and GitHub App settings are not assumed to exist.
4. **Preserve required signed commits and protected-branch rules.** Release automation must produce GitHub-verified release commits/tags through an approved credential/signing mechanism, or stop with clear remediation; no bypass or weakening of repository security is authorized.
5. Test release/publish workflow logic and dry runs; require a separately reviewed first real publication and record integrity, provenance, tag and clean-install verification evidence. Only immutable published artifacts may be promoted to downstream consumers.

### 4. Contract conformance and adoption remain separate gates

- Retain independent conformance tooling and fixtures for OpenAPI comparison **and real positive, negative and security-sensitive HTTP behavior**. They can be invoked as Nx tasks in this repository, but consumers must be able to run the same tooling *without* Nx.
- Maintain CI on pull requests and `main`: immutable Yarn install, affected builds/types/tests where appropriate, deterministic OpenAPI verification, SemVer/breaking-change analysis, packed ESM/CJS/Node/browser consumers and required runtime conformance cases. The release workflow cannot treat a green code build alone as a contract compatibility approval.
- Coordinate with [3-Tier EPIC #485](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/485), [DDD EPIC #23](https://github.com/anarchitects/anarchitecture-bricks-ddd/issues/23) and optional [Plugins EPIC #581](https://github.com/anarchitects/anarchitecture-plugins/issues/581). Bricks consume independently published/pinned contract versions; the Plugins integration, if any, wraps the framework-neutral CLI. Missing DDD capabilities are never declared implemented.
- **Contracts migration precedes Nest 12-native modernization.** Neither this ADR nor #8 authorizes runtime authentication, authorization, mail, HTTP-adapter or domain changes.

## Precedence and transition

This Accepted ADR **partially supersedes** only the *tooling and release-mechanism* decisions of earlier local ADRs:

| Earlier decision | Interpretation after this ADR |
| --- | --- |
| ADR-0001 §Decision 1: no Nx for build or consumption | Historical initial-foundation choice; **Nx now required in the development workspace**, but **never required to consume published contracts or independent conformance tools**. Yarn/Node/lockfile and immutable installations remain valid. |
| ADR-0001 §Decision 6: Changesets records release intent/changelogs | Valid only as **current transitional state** until issue #8 migrates pending entries; **Nx Release becomes the only permanent release authority**. Independent versions, npm scope and compatibility safeguards remain valid. |
| ADR-0001 §Alternatives: Nx unnecessary for foundation | Historical scope assessment, not an ongoing prohibition. |
| ADR-0002 §Decision 10: domain versions via Changesets | Independent domain versioning and wire compatibility remain accepted; **use Nx Release for ongoing versioning/publication after issue #8's explicit cutover**. |

The existing workflows remain the **actual implemented state** until migration PR(s) and release smoke tests land. Acceptance of this ADR is a direction and does not claim that Nx is already installed, Changesets already retired, npm already configured, or packages already published. If #8 is split, it remains the parent release acceptance gate and each subtask must have its own PR.

## Acceptance evidence for #8

- Each publishable package appears correctly in `nx show projects` and is built/tested/packed with reproducible Nx targets and no changed wire contract.
- Pending Changesets release intent has an auditable mapping into Nx Release, with a single versioning authority at cutover.
- Independent release tags/changelogs and signed, reviewable GitHub release automation operate without bypassing repository protections.
- Release-tag-based npm publishing validates package contents, compatibility, security tests and trusted provenance before publication.
- At least one controlled first publication and downstream **clean installed-consumer** verification is demonstrated; other packages meet the same gates before their own publication.
- Docs, CI, agent instructions and active ADR references consistently explain the new release process.

## References

- [Contracts EPIC #1](https://github.com/anarchitects/anarchitecture-contracts/issues/1)
- [Contracts issue #8](https://github.com/anarchitects/anarchitecture-contracts/issues/8)
- [Contract package design](0002-domain-contract-authoring-and-publishing-boundaries.md)
- [Release runbook](../docs/releases.md)
