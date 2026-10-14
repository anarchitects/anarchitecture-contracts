# Nx Conventional Commit release migration

Accepted [ADR-0004](../adr/0004-package-initial-release-and-nx-versioning.md)
implements Meta ADR-0013. Conventional Commits now control Nx version bumps;
version-plan creation and consumption have been removed. The historical record
below describes the previous implementation, not the active release procedure.
Use the [release runbook](releases.md) for current commands.

## Independent publication correction (#20)

[ADR-0005](../adr/0005-independent-contract-publication-and-implementation-conformance.md)
refines the historical host-dependent publication gate described below. Canonical
contract validity now gates package publication; implementation conformance and
deployment compliance are separately evidenced downstream. The existing Nx
versioning architecture and all ADR-0004 rules remain unchanged.

Package generation and regeneration after versioning produce canonical format-2
manifests and canonical OpenAPI exports, retaining diagnostic exports. Protected
operations stay excluded from paths until bindings resolve; all normative
obligations remain in the inventory. Gate A verifies source-derived exact bytes;
Gate B preserves real host evidence, approvals and Forms D05/D08 restrictions.
P07 source/generator pins and projection code are unchanged; canonical presentation
has its own generator digest. The historical records below are not current gate
instructions. No historical plan or Changesets input becomes active again.

## Architecture review and inventory

Reviewed all four local ADRs at Contracts `3de3645ba90a5d659d01bd824d8a19d612f895db`
and all sixteen Meta ADRs at `a66c525132cab0e59d12d55a92bb0d1830953f8e`.
Both revisions matched upstream `main` on 2026-10-14. Reviewed package/release
conventions, OpenAPI compatibility guidance and the Meta neutral-package guide.
The cooperative-enrichment and governance hierarchy/Archi/workspace proposals
remain contextual. ADR-0004 explicitly supersedes the old version-plan authority
and first `0.1.0` target; other accepted ownership and compatibility rules stand.

The Nx graph contains Auth, Forms, Identity and Newsletter contract projects plus
the private `contract-checks` project. All four manifests remain `0.0.0`. Git tags,
GitHub Releases and all four public npm registry names had no distributions at
migration time. No released versions or history were rewritten. Bricks domain
alignment does not apply to these independently versioned contracts.

## Pending intent disposition

All five former version-plan files are preserved byte-for-byte in
[the release-history archive](release-history/README.md). The original four-entry
Changesets ledger remains immutable. Its `expectedFirstVersion: 0.1.0` records
past equivalence, not an executable expectation. ADR-0004 changes the first
release target to `0.0.1`; the initial features, compatibility rationale and
publication limitations remain part of the initial release's review evidence.
Existing historical `feat` commits are not rewritten and cannot inflate the
explicit initial release version. Subsequent releases derive bumps from commits
since each independent package tag.

## Enforcement and validation

- Nx's public dry-run API supplies actual proposed versions to the independent
  contract compatibility checker. Manual manifest changes are not bump intent.
- `init` is explicitly non-bumping; every allowed type is mapped. Commit scopes
  come from the active Nx graph, with lifecycle validation and PR-title checks.
- First distribution is explicitly `0.0.1`, including GitHub Releases. Remote
  history failures stop CI release/publication validation. Initial prereleases
  and restarting an already distributed package's lifecycle are rejected.
- Real isolated Nx/Git fixtures exercise initialization, patch/minor/breaking
  commits, zero-major releases and mixed lifecycle policy. Contract tests reject
  insufficient bumps even with approved migration evidence.
- Release automation, signing, immutable tags, packed consumers, P07 reviews,
  host blockers and Forms D05/D08 remain in force. Dry runs are not publication.

Local verification passed on Node 24.21.0 / Yarn 4.18.1: immutable installation,
formatting, the full 22-task `yarn check` graph, `yarn test:release`, and package
compatibility against the migration base (no wire/package-surface findings).
All five archived plans match their original bytes. Live signed release and npm
publication remain unexercised; Node 22 consumers are verified separately in CI.

## Explicit specifier follow-up

Rechecked the unchanged local and Meta ADR revisions above. The workflow exposes
Nx's optional `specifier` instead of `preid`. Empty input uses Conventional
Commits; explicit input is resolved by Nx and must preserve its derived numeric
version. First distribution remains exactly `0.0.1`. An existing prerelease may
be promoted to its final version without new commits. Contract compatibility,
migration evidence and publication gates still apply.

`releaseTag.strictPreid: false` lets Nx resolve the latest package tag, including
prereleases, without a separate identifier. Real Nx/Git fixtures cover keywords,
exact prereleases, continuation, promotion, insufficient/excessive versions and
first-release restrictions.

## Historical #8 migration record (superseded release input)

This is the first implementation increment of [#8](https://github.com/anarchitects/anarchitecture-contracts/issues/8).
It makes the four contract packages Nx projects and transfers release intent to
Nx Release. It does not complete #8, create a release, publish to npm or claim
downstream adoption. Community-style release/publish workflows now use Nx targets and the standard
Nx publisher. Live credential/signing verification and standalone HTTP conformance
remain required by the [release runbook](releases.md).

### Architecture review

Reviewed all three local ADRs at starting Contracts revision
`8e920d0a6ff546e49e4a9000b8b6ac69e145ffb9`, including the partial supersessions
in accepted ADR-0003. Read all 15 Meta ADR files at
`e2f34553c6e2492d0ab6f80ac795de44fc592a70`; GitHub `main` matched this revision
on 2026-10-13. This includes both ADR-0001 records, the cooperative-enrichment
proposal, both ADR-0008 records and the historical landscape record.

Applicable accepted decisions preserve both implementation styles, canonical
transport ownership, framework-independent consumers, Zod-first authoring,
safe compatibility and the auth-ts semantic boundary. Local ADR-0003 explicitly
supersedes no-Nx development and Changesets as release authority. The
cooperative-enrichment and Meta ADR-0005/0006/0007 proposals remain contextual;
they do not override accepted decisions. No unresolved architecture conflict
was found. Native Node evaluation is not a runtime migration mandate.

Reviewed package/release conventions, schema authoring, operation definitions,
baseline dispositions, OpenAPI generation guidance and Meta's neutral-package
boundary guide. Canonical schemas, operation definitions, frozen baselines,
generated artifacts and source/generator-pinned P07 approvals stay unchanged.

### Workspace

Node 24, Yarn 4.18.1 and immutable installs remain required. Nx and `@nx/js` are
pinned to 23.3.0 as root development dependencies. A version-scoped Yarn package
extension supplies the `nx` peer omitted by `@nx/js` for its `@nx/devkit` dependency.
Install scripts remain disabled; no Nx Cloud account/service is configured.

Each `<domain>-contracts` project has:

- An inferred `@nx/js/typescript` typecheck, emitting private declarations under
  `.nx/typecheck/`; these are not the published declarations.
- The existing tsup ESM/CommonJS build and declaration bundling, now selectable
  by domain. Direct Node invocation remains available without the Nx CLI.
- Package tests and shared packed-consumer/OpenAPI targets. The delegating
  `pack`/`contract-check` targets schedule the full shared suite, once per task
  graph, including all published subpaths, TS 5.5/6 and browser bundles.
- An uncached publication check after artifact and consumer validation. The
  publish target uses the standard `@nx/js:release-publish` executor. Because
  scoped Nx publishing skips dependencies, `publish.yml` explicitly runs the
  gate before publishing. Current review-only artifacts still fail it.

The private `contract-checks` project depends on all four domains. The domain
projects have no invented cross-domain dependencies. Builds use `^build` for
future approved dependencies and cache only their own `dist`. Named inputs
include shared authoring/build tools, compiler configuration, lockfile, Node
version and package source; package tests additionally include baseline fixtures.
Generation checks, packed installs and publication checks are uncached so they
inspect actual artifacts. Root references are maintained by `yarn nx sync`.

CI retains the full existing verification suite and Node 22/24 packed-consumer
matrix. It also exercises Nx affected checks against the exact PR/push base and
the package-aware compatibility/release-plan gate. Local daemon/plugin isolation
can be disabled with `NX_DAEMON=false NX_ISOLATE_PLUGINS=false` in restricted
environments; this does not change contract checks or require a remote cache.

### Changesets transfer

The immutable [migration ledger](../tools/release/changesets-migration.json)
records each original path, exact body, SHA-256 and destination. Only package
names in frontmatter were mapped to Nx project names; all release rationale and
limitations were retained.

| Original entry                   | Nx projects                           | Intent |
| -------------------------------- | ------------------------------------- | ------ |
| auth-identity-first-contracts    | auth-contracts, identity-contracts    | minor  |
| forms-newsletter-first-contracts | forms-contracts, newsletter-contracts | minor  |
| openapi-review-artifacts         | all four domains                      | minor  |
| profile-resolution-gates         | all four domains                      | minor  |

Both systems combine these pending entries into one minor bump per package:
`0.0.0` to `0.1.0`. Nx 23 defaults to reducing a pre-1.0 minor bump to patch;
`adjustSemverBumpsForZeroMajorVersion: false` is essential for equivalence.
`yarn test:release` runs Nx's public release API in dry-run mode and asserts
independent expected versions and unchanged manifests, lockfile and plan files.

Nx version plans are the sole ongoing bump/changelog input. Conventional commit
classification informs reviewed plans; it cannot override semantic compatibility.
Direct CLI Git actions remain disabled by default; the workflow release target
explicitly enables signed Git actions and Nx GitHub Release creation. The
root and tooling project are absent from the explicit release allowlist.
All Changesets scripts, config, dependency and CI authority have been removed.
The ledger is historical evidence, not another executable release plan.

A pre-existing Git reader buffer limit was also corrected: the 1.7 MB Newsletter
inventory exceeded Node's default 1 MB buffer and was incorrectly treated as
absent. Large inventories now compare normally; only an explicitly missing
historical path returns absence, and other Git failures stop the check.

The compatibility adapter still rejects insufficient bump intent and requires
exact migration records for breaks. It excludes unchanged plans and recognizes
mechanical transfers from a pre-cutover base, so old intent cannot silently cover
new package changes.

### Local validation

Validated on Node 24.21.0 and Yarn 4.18.1:

- `yarn install --immutable`, `yarn format` and `yarn check`.
- Nx project listing/graph, inferred typechecks, all four dual-format builds,
  cache reuse and `yarn nx sync:check`.
- Deterministic verification of all 21 generated files, frozen/differential tests
  and clean ESM/CommonJS/TypeScript 5.5/6/browser package consumers.
- `yarn openapi:compatibility HEAD`: patch intent for the four package README
  updates; no canonical source or generated-contract change.
- Nx Release dry runs produce independent `0.1.0` versions and preserve all
  pending rationale. The publication gate rejects review-only artifacts before the workflow can
  invoke npm. Regression checks run through `yarn test:release`.

Node 22 is retained in the CI installed-consumer matrix; no local Node 22 binary
was available for this increment. The initial PR CI passed on GitHub, including both consumer runtimes. Signed
release and actual npm publication have not been exercised. These are validation gaps, not successes
inferred from local builds.

### Remaining acceptance gates

The repository migration is not the completed release migration. #8 still needs
an approved signing/trusted-publishing setup, live workflow verification, independent HTTP runner
packaging and real host conformance. A reviewed first publication must record
versions, tags, integrity, provenance and clean installed-consumer evidence.
Host blockers (including Forms D05/D08) and unsupported DDD capabilities remain
explicit. See the [issue's publication gate](https://github.com/anarchitects/anarchitecture-contracts/issues/8#issuecomment-6146771202).

Rollback before publication is a reviewed revert of this tooling change; the
immutable ledger and Git history retain release intent. After publication, keep
the last verified immutable consumer pin and fix forward. Never overwrite a
released artifact or revive two independent release authorities.

### Community-style workflows and Nx commands

Rechecked ADR-0003 and the unchanged Meta revision above for this follow-up.
The release/publish split follows Community's small workflow model. Root scripts
now delegate to `contract-checks` Nx targets, with dependencies scheduling the
existing checks once per graph. CI and delivery invoke Nx directly. No domain
release groups or alternative version authority were introduced.

The sole release orchestration helper uses Nx's public API to insert deterministic
artifact generation and checks between versioning and signed changelog/tag creation.
A read-only dry run exercises that same Nx version/changelog path. Inputs cannot
silently override pending plans. The publisher resolves a verified annotated tag
to an immutable SHA and uses the standard Nx executor after the explicit gate.
See the [runbook](releases.md#workflow-operation) for required credentials, npm
mapping, replay behavior and the remaining live-evidence limitations.

GitHub CI passed at workflow implementation revision
`99b0e95f0563eb5cc517096fa75416425d963729`, including the full workspace suite and
both Node 22/24 consumer jobs ([run](https://github.com/anarchitects/anarchitecture-contracts/actions/runs/38423737123)).
The signing setup is documented as a local GitHub CLI procedure; no private key
or passphrase is committed or handled by the repository tools. The key-import
action is pinned to the reviewed v6 commit.
