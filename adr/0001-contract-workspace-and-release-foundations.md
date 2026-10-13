# ADR-0001: Contract workspace and release foundations

- Status: Accepted
- Date: 2026-10-13
- Owners: Architecture maintainers
- Scope: Repository foundation and package/release conventions
- Partial supersession: [ADR-0003 — Nx Workspace and Release Governance](0003-nx-workspace-and-release-governance.md) replaces the initial no-Nx development/build strategy and Changesets as ongoing release authority; other foundation decisions remain Accepted.
- Implements: [issue #2](https://github.com/anarchitects/anarchitecture-contracts/issues/2), under [EPIC #1](https://github.com/anarchitects/anarchitecture-contracts/issues/1)

## Context and initial audit

Before writing files on 2026-10-13, the local checkout contained only `.git/`,
with a clean working tree and an unborn `main` branch. There were no commits,
source files, package manifests, lockfiles, local ADRs, licenses or CI workflows
to preserve. The remote was `anarchitects/anarchitecture-contracts`; GitHub
reported a public repository of size zero with default branch `main`.

[Meta PR #23](https://github.com/anarchitects/anarchitecture-meta/pull/23) merged
on 2026-10-12 and accepted ADR-0012, establishing this repository's ownership.
All 15 Meta ADR files were reviewed from revision
`e2f34553c6e2492d0ab6f80ac795de44fc592a70`, including both ADR-0001 records, the
additional cooperative-enrichment proposal and both ADR-0008 records. No local
ADRs existed at the time of the audit.

Applicable accepted decisions are Meta ADR-0004 (landscape authority), ADR-0008
(HTTP independence and the Angular decision's neutral-package boundary),
ADR-0010 (Zod direction and Nest 11 patch-only support), ADR-0011 (safe wire and
policy migration), and ADR-0012 (canonical contract ownership). Both implementation
styles remain first-class under ADR-0001; no implementation becomes the other's
API authority.

The cooperative-enrichment ADR and ADR-0005/0006/0007 governance proposals were
read as context and remain proposed. They require no implementation here.
The accepted native Node decision is an evaluation mandate, not a runtime
dependency requirement. No conflicting accepted decision was found. This local
decision refines Meta ownership without changing it.

## Decision

1. Use a private Yarn 4 workspace rooted at `packages/*`, pinned initially to
   Yarn 4.18.1 and Node 24 for repository tooling. Use `node_modules` linking,
   a committed lockfile, exact direct development dependency versions and
   immutable CI installs. Dependency install scripts are disabled by default.
   The initial foundation did not require Nx to build or consume contract packages. **ADR-0003 now requires Nx for repository development/build orchestration**, while consumers must never require Nx.
2. License this repository under MIT, consistent with the Bricks repositories'
   declared license. Preserve provenance and applicable notices when later
   extracting existing material.
3. Require agents to enumerate and read every Meta and local ADR, including
   historical and proposed records, before generating code. Apply status
   correctly, flag conflicts and read relevant engineering guides. Record this
   obligation in `AGENTS.md`.
4. Own public transport schemas and first-class HTTP operation metadata only.
   Author canonical schemas in Zod, infer types and generate deterministic
   OpenAPI 3.1. Exclude domain invariants, application logic and policy evaluation
   semantics. Preserve the `auth-ts` semantic ownership boundary.
5. Keep all contract runtime packages independent of Nest, Fastify, Express,
   Angular, Nx and both Bricks implementations, including peer and transitive
   runtime dependencies. Implementations and optional integrations consume
   released or immutable pinned artifacts in the downstream direction.
6. Use independent package versions under `@anarchitects`, with public npm
   access, explicit exports and pack allowlists. Changesets tracks per-package
   release intent and changelogs during the initial foundation only; **ADR-0003 establishes Nx Release as the sole long-term release authority**, with an explicit reconciliation of pending Changesets before cutover. No fixed/linked version group or root release.
   Wire compatibility determines version impact, with reviewed migration for
   breaks. [Package conventions](../packages/README.md) and
   [release conventions](../docs/releases.md) define the required evidence.
7. Start CI with immutable installation, formatting, Markdown lint and release
   plan validation. Add package builds, installed-consumer tests, deterministic
   generation, compatibility and HTTP conformance gates when their respective
   issues introduce those capabilities. CI cannot publish in this foundation.
8. Keep the initial workspace free of placeholder runtime packages. Issue #3
   audits the current API; #4 decides actual package names, layout and module
   formats; #5/#6 extract contracts; #7 supplies OpenAPI/diff gates; #8 supplies
   conformance tooling and publication. Each issue receives a separate PR.

## Consequences

The repository has reproducible tooling and explicit ownership/release rules
without runtime framework dependencies. Yarn and Changesets introduce development
dependencies but are not dependencies of future contract consumers.

The first CI checks cannot establish API compatibility or consumer support because
contracts do not yet exist here. The accepted architecture does not declare
packages published, TypeBox retired, or 3-tier/DDD consumers migrated. Those claims
require the evidence and staged gates in the epic.

## Alternatives

Nx was not necessary for the initial foundation. **ADR-0003 supersedes this historical tooling assessment for the release-ready workspace.** Independent consumption remains mandatory.
A shared repository version would couple domain release cadence. Empty published
packages would imply availability before the baseline audit and package design.
Deferring all governance until extraction would leave that work without explicit
ownership, compatibility or release rules.
