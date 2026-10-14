# Package and release conventions

## Current status

The private root and verification tooling are excluded from release. The four
contract packages remain unreleased at `0.0.0`. Nx 23.3.0 / `@nx/js` now orchestrate
builds and checks, and **Nx Release is the only configured versioning authority**.
[ADR-0004](../adr/0004-package-initial-release-and-nx-versioning.md) makes
Conventional Commits the bump authority. Initial development uses non-bumping
`init(<exact-nx-project-name>)`; explicit first distribution is exactly `0.0.1`.
Historical Changesets and version-plan rationale is retained in the
[migration record](nx-migration.md), not consumed by release tooling.

The Community-style `release.yml` and `publish.yml` workflows now prepare signed
independent releases and publish from immutable tagged commits. They are pipeline
implementation, not completed publication evidence for [issue #8](https://github.com/anarchitects/anarchitecture-contracts/issues/8).

Generated OpenAPI remains review-only. Real host security/behavior profiles and
Forms D05/D08 remain explicit blockers; no npm publication or downstream adoption
is approved. The existing publication gate runs before a live release and again
before npm publication. Scoped Nx publishing skips target dependencies, so the
publish workflow invokes this gate explicitly. The publisher itself is the standard
`@nx/js:release-publish` executor; local ad hoc publication is unsupported.

Issue #7 supplies [deterministic generation and compatibility gates](openapi.md).
The accepted [scoped P07 register](openapi-projection-proposal.md) stays unchanged;
synthetic verification cannot authorize release. Package-aware checks still
require new release intent for every affected package and matching migration
evidence for breaks.

## Changes and compatibility

Use lifecycle-appropriate Conventional Commits for each public package
change. Document affected operations, wire behavior, compatibility reasoning and
required migration steps. Foundation-only documentation/tooling changes need no
package version bump.

| Bump  | Rule                                                                                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Patch | Compatible correction with no break to supported wire behavior or package exports. Fixing an implementation discrepancy is not automatically wire-compatible. |
| Minor | Backward-compatible capability addition, verified against existing consumers. An added field or enum value is not automatically compatible.                   |
| Major | Breaking wire or package API change, with an explicit reviewed migration and downstream coordination.                                                         |

Request constraints, required fields, response shapes, status codes, errors,
authentication, authorization, headers, cookies, operation IDs and exported types
are all compatibility surfaces. Assess both request and response directions.
Preserve the audited baseline unless a deliberate versioned change is reviewed.
Pre-1.0 releases still require explicit breaking-change disclosure and migration;
do not use `0.x` as permission for silent drift. First distribution must be `0.0.1`, with all compatibility and conformance gates
satisfied. A later promotion to `1.0.0` requires deliberate release review.

### Directional compatibility and independent versions

For each affected operation, compare an existing client against the new contract
and a new client against supported older implementations. Preserve previously
accepted requests, their parsed meaning, response fields/types and security
behavior. An expansion of accepted input can still break a security guarantee;
an expanded response enum can break an exhaustive client. A nominally unchanged
HTTP payload can also break imports, inferred input/output types or operationIds.

| Change                                                                                                              | Default treatment; evidence can establish a narrower impact                                                          |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Add a required request field, reject old input, change coercion/default/null handling                               | Breaking: major after 1.0, reviewed migration and implementation coordination                                        |
| Remove/rename a response field, change status/error/header/security behavior or policy wire meaning                 | Breaking: major after 1.0; tests must include negative and security behavior                                         |
| Rename a published operationId/schema ID/export, remove a module format or raise a supported compiler/runtime floor | Breaking package/tooling surface even if HTTP is unchanged                                                           |
| Add an operation or optional field                                                                                  | Minor only with verified compatibility; capability absence remains explicit for old implementations                  |
| Add missing metadata for an existing operation before its first canonical release                                   | First-release reconciliation, with provenance; do not claim the old generated spec was complete                      |
| Correct documentation or generator output without changing supported semantics, IDs or public types                 | Patch with artifact and consumer evidence; a “bug fix” label alone is insufficient                                   |
| Update Zod or a cross-domain dependency                                                                             | Assess every affected domain's parsing, types and generated artifacts; unchanged source does not prove compatibility |

During prerelease `0.x` development, document breaks and use a new minor line
(for example `0.2.0-next.0` after `0.1.x`); compatible corrections use patch and
compatible additions use minor. Never disguise a break as an ordinary patch.
Nx Release prerelease mode and the non-`latest` dist-tag must be deliberate. At
and after 1.0, breaking changes require a major release. A security-driven wire
change still needs explicit disclosure and coordination; it is not a silent patch.

Versions are per npm package, not per endpoint, capability subpath, repository
commit or aggregate OpenAPI document. A passkey change versions Auth; a native
action change versions Newsletter. The other domains do not bump unless their
published code, types, dependencies, artifacts or compatibility commitments change.
There are no fixed release groups and no runtime meta-package that
forces all four domains to upgrade together.

Cross-domain references require a reviewed acyclic dependency on an owning public
wire export. Workspace ranges must become tested published SemVer ranges in the
tarball; release dependencies before dependents. The generated manifest records
exact resolved versions/digests. If a dependency changes incompatibly, its
dependents must assess their own public surface and bump deliberately; neither
the dependency's major number nor an automatic Nx dependent patch is sufficient
evidence. See [package conventions](../packages/README.md#cross-domain-references).

Package SemVer does not automatically add `/v2` paths or change HTTP headers.
A breaking wire migration must separately define how old/new clients and host
deployments coexist, which pins remain supported and how rollback works.
Unresolved [baseline blockers](baseline-dispositions.md) prevent the affected
stable capability claim; a new package version cannot bypass them.

All scoped commits must name an exact project in `yarn nx show projects`, such as
`auth-contracts`, not `auth`, an npm scope or a release group. Repository-wide
commits may be unscoped. Before release, package development uses `init`; after
any distribution, including `0.0.x`, it uses normal Conventional Commits. Split
commits spanning released and unreleased packages. CI validates every non-merge
commit and the PR title used for squash merges. Unknown types fail. The complete
Nx type mapping is explicit, including `init`, `docs` and tooling types with
`semverBump: none`. Breaking notation on `init` is rejected.

`adjustSemverBumpsForZeroMajorVersion: false` preserves compatible additions as
minor bumps; Nx breaking commits propose a major even before 1.0. Contract policy
requires at least a new minor line before 1.0, so that conservative Nx major is
sufficient. Explicit specifiers are resolved by Nx and checked against its
Conventional Commit preview; they cannot change the derived major/minor/patch
version. There is no second bump calculator.

`yarn openapi:compatibility <base-ref>` compares package surfaces against the
exact base and validates Nx's actual proposed version. Unreleased development
remains at `0.0.0`; the explicit first-release operation selects `0.0.1`.
Baseline/migration checks still run for unreleased work. At release time the
cumulative delta is also compared against the last package tag, and any breaking
migration record must match that release baseline and findings.

```sh
yarn nx show projects
yarn commits:check origin/main
yarn release:dry-run                      # ordinary preview; init does not bump
yarn release:dry-run --first-release      # explicit initial 0.0.1 preview
yarn test:release
yarn openapi:compatibility origin/main
```

Local dry runs use fetched Git tags and do not query remote distribution history.
The manual release workflow (including its dry run), CI commit checks and
publication query GitHub Releases and the public npm registry. Network and
authorization failures stop validation; an explicit npm 404 means no package.
Missing tags for known distributions require history reconciliation, never a
fresh initial release. Fetch full tags before local checks. No distributions
existed at this migration, so there is no grandfathered version exception here.

## Workflow operation

Use **Release (Manual)** on `main`. Select comma-separated eligible Nx projects;
an empty selection considers all four. Ordinary releases consider already
released projects only. An explicit `first_release` selection must contain only
unreleased packages and always produces `0.0.1`. Release packages in different
lifecycle states in separate operations. Official prerelease distribution before
`0.0.1` is forbidden; subsequent prereleases retain the existing `next` dist-tag
handling. The optional `specifier` accepts standard Nx keywords (`patch`, `minor`,
`major`, `prepatch`, `preminor`, `premajor`, `prerelease`) or an exact SemVer.
Leave it empty to use Conventional Commits. For first release, leave it empty or
enter exactly `0.0.1`; a keyword or prerelease is rejected.

For released packages, Nx previews both the conventional version and the explicit
specifier. Their numeric major/minor/patch versions must agree for every selected
project. A specifier cannot force an unrelated bump or create a release when
commits do not warrant one. It can select a prerelease of the derived version;
use an exact version for a label such as `beta`. The separate `preid` input is
not exposed. Examples for a package at `1.2.3` with a `feat` commit:

| Specifier          | Result                                              |
| ------------------ | --------------------------------------------------- |
| Empty or `minor`   | `1.3.0`                                             |
| `1.3.0-beta.0`     | `1.3.0-beta.0`                                      |
| `preminor`         | `1.3.0-0` (Nx's default numeric prerelease)         |
| `patch` or `2.0.0` | Rejected: differs from Nx's derived numeric version |

An existing prerelease may be promoted to its exact final version even without
new commits: `1.3.0-beta.1` with specifier `1.3.0` becomes `1.3.0`. With relevant
new commits, `prerelease` advances the prerelease counter. Nx's
`releaseTag.strictPreid: false` includes prerelease tags when resolving the latest
package version, without requiring a separate identifier. Downgrades, repeats,
and unrelated numeric versions are rejected. Contract compatibility and pinned
migration checks still apply to the actual selected version. If Nx's prerelease
continuation does not cover a new contract break, the gate stops the release;
a manual specifier cannot bypass it. Select projects separately when one
specifier cannot satisfy their independent versions.

Keep `dry_run` enabled to preview versions, changelogs and signing/tag actions
without writes or signing credentials. Package manifests and generated artifacts
must agree before any live release is committed.

For a live run, disable `dry_run`. The workflow runs `nx run contract-checks:check`,
then `nx run contract-checks:release`. The release target uses Nx's public
`releaseVersion` and `releaseChangelog` APIs, with no npm publishing phase. This
is the one required orchestration exception to direct Nx Release CLI calls:
independent `versionData` must survive artifact regeneration between versioning
and the signed commit/tag. Nx's changelog CLI only accepts one version string.
The helper delegates generation, validation and compatibility to Nx targets;
Nx still controls bumps, changelogs, signed commits/tags,
atomic push and GitHub Releases. There is no domain release runner.

**Publish** runs on `release.published`, or manually with an existing published
release tag. It validates the tag/project, requires GitHub-verified tag and commit
signatures, checks out the resolved commit SHA and requires ancestry on `main`.
It runs `contract-checks:verify` (the existing full artifact/consumer suite),
compatibility against the previous package tag (the release commit's parent for
a first release), and `<project>:publication-check`. The tag, package and manifest
versions must agree. Only then does it invoke scoped `nx release publish` with
OIDC/provenance. Concurrency serializes replay of the same tag; Nx detects an
already-published version rather than overwriting it. Manual replay does not
create tags or approve an unpublished GitHub Release.

Required setup before the first live run:

- GitHub App secrets `ANARCHITECTS_BOT_CLIENT_ID` and
  `ANARCHITECTS_BOT_PRIVATE_KEY`, with repository contents access. The App token
  also lets the GitHub Release event trigger the separate publish workflow.
- `RELEASE_GPG_PRIVATE_KEY` and, if needed, `RELEASE_GPG_PASSPHRASE`. Use an
  approved signing identity whose public key and email are registered with GitHub.
  App authentication and setting a bot author alone do not produce verified signatures.
- Preserve existing branch rules. If a signed release commit cannot be pushed
  under those rules, the atomic push stops; do not grant a bypass or disable checks.
  A repository requiring release changes through PRs needs a separately reviewed
  integration before live automation can run.
- Configure npm trusted publishing for each eligible package with owner
  `anarchitects`, repository `anarchitecture-contracts`, workflow `publish.yml`,
  environment `npm`. Node 24 must provide npm >=11.5.1. No npm token is introduced.
  First-package onboarding/organization permissions must be resolved with npm
  maintainers before the first release; configuration is not assumed by this PR.

All root verification/formatting scripts are now aliases for Nx commands. Plain
Node implementations remain behind targets for schema generation, compatibility,
packed consumers and behavioral checks; Nx schedules these domain-specific tools
but cannot replace their semantics. The CI Node 22 packed-consumer invocation
intentionally remains direct Node to exercise the independently usable tooling
without running the Node 24 Nx workspace under Node 22.

### Signing setup with the GitHub CLI

Run these commands yourself in a local terminal. Use a dedicated release key
associated with your GitHub account or an approved automation account. The key's
email must be verified on that account. The import action derives the Git author
and committer from the key; the GitHub App authenticates the push, but is not the
signing identity. Do not use the App's `[bot]` email for a key registered to your
personal account.

1. Authenticate the CLI as the signing account, with access to manage repository
   Actions secrets. On macOS, install `gh` and `gnupg` with Homebrew if missing.

   ```sh
   gh auth login --hostname github.com
   gh auth refresh --hostname github.com --scopes write:gpg_key
   gh auth status
   ```

2. Generate a dedicated key. Choose **RSA and RSA**, **4096 bits**, an expiry
   such as **1 year**, your account's name and verified email, and a strong
   passphrase. Save the passphrase in your password manager.

   ```sh
   export GPG_TTY=$(tty)
   gpg --full-generate-key
   gpg --list-secret-keys --keyid-format LONG
   ```

   Copy the full fingerprint shown below the new `sec` entry. In the same terminal:

   ```sh
   RELEASE_KEY_FPR='REPLACE_WITH_THE_FULL_FINGERPRINT'
   CONTRACTS_REPO='anarchitects/anarchitecture-contracts'
   set -o pipefail
   ```

3. Register the **public** key with the signed-in GitHub account:

   ```sh
   gpg --armor --export "$RELEASE_KEY_FPR" |
     gh gpg-key add --title 'Contracts release signing'
   ```

4. Export the **private** key straight into a repository Actions secret. This
   avoids writing a private-key file or displaying its contents. GPG may prompt
   for the passphrase while exporting; `gh` encrypts the secret before upload.

   ```sh
   gpg --armor --export-secret-keys "$RELEASE_KEY_FPR" |
     gh secret set RELEASE_GPG_PRIVATE_KEY --app actions --repo "$CONTRACTS_REPO"
   ```

5. Store the same passphrase using the CLI's hidden interactive prompt:

   ```sh
   gh secret set RELEASE_GPG_PASSPHRASE --app actions --repo "$CONTRACTS_REPO"
   ```

   Paste the passphrase at the prompt, not as a command argument. This secret is
   optional only if the private key was created without a passphrase.

6. Confirm the public key and secret names are present (secret values are not
   displayed):

   ```sh
   gh gpg-key list
   gh secret list --app actions --repo "$CONTRACTS_REPO"
   ```

These are repository secrets, not secrets on the `npm` environment: signing runs
in `release.yml`, while `npm` belongs to the separate publish job. Keep the App
credentials listed above configured as well. Rotate the signing key before its
expiry and update both the GitHub public key and Actions secrets together.

After the workflow is merged to `main`, preview the initial release with:

```sh
gh workflow run release.yml --repo "$CONTRACTS_REPO" --ref main \
  -f first_release=true -f dry_run=true
```

The dry run skips key import and tests Nx release planning, not the signing secrets.
A live release still requires approved publishable host profiles and unchanged
branch protections. Setting secrets does not remove the current publication blockers.

References: [GitHub key generation](https://docs.github.com/en/authentication/managing-commit-signature-verification/generating-a-new-gpg-key),
[GitHub public-key registration](https://docs.github.com/en/authentication/managing-commit-signature-verification/adding-a-gpg-key-to-your-github-account),
[gh gpg-key add](https://cli.github.com/manual/gh_gpg-key_add), and
[gh secret set](https://cli.github.com/manual/gh_secret_set).

## Release sequence and evidence

1. Complete the frozen API inventory and discrepancy review before extraction.
   Acceptance of Meta ADR-0012 does not by itself prove compatibility.
2. Run immutable installation, foundation checks and every package's build,
   type and behavioral checks. Reproduce and validate OpenAPI 3.1 with no generated
   drift. Compare against the previous released contract or frozen first-release
   baseline, including negative and security fixtures.
3. Prepare independent versions and changelogs with Nx Release in a reviewed release change.
   Review independent dependency bumps; a shared dependency's breaking change
   can require consumer package changes even when its own source is unchanged.
4. Pack each changed package and verify its contents, license, exports,
   declarations, module formats, dependency ranges and clean installed-consumer
   behavior outside the monorepo. Resolve workspace references in shipped
   manifests; no local paths or mutable Git branches are release dependencies.
5. Publish the reviewed artifacts to npm with public access and provenance from
   the verified source revision. Record package name/version, source commit,
   package-specific tag (`<project-name>@<version>`), integrity and CI evidence.
   Prereleases use an explicit prerelease version and non-`latest` dist-tag.
6. Update each consumer to an exact released version or a documented immutable
   artifact pin with integrity evidence. Verify actual HTTP behavior against
   that same version before marking a capability supported.

The sequence above remains gated. The rest of #8 must implement and verify:

- Live verification of signed release automation and immutable-tag trusted
  publishing with the approved credentials and unchanged branch protections.
- An independently consumable conformance CLI/fixtures with actual positive,
  negative and security-sensitive HTTP checks. Current offline fixture checks
  do not establish deployed host conformance.
- Reviewed first real publication, registry integrity/provenance and clean-install
  evidence, followed by immutable consumption instructions for 3-Tier #485 and
  DDD #23. Synthetic profiles and a green build cannot supply this evidence.

The owning workflow must stop with remediation if signing credentials, branch
permissions, npm organization permissions or trusted-publisher mappings are absent.
Do not weaken repository protections or treat dry-run evidence as publication.

## Adoption and rollback

Track support per implementation and capability: contract package/version,
implementation revision, supported operations, adapter/runtime and linked
positive/negative/security conformance evidence. Unsupported capabilities remain
explicitly missing. Package publication is not proof of either Bricks repository's
adoption, and schema equality alone is not HTTP conformance.

Release contracts before dependent consumer changes. Preserve supported consumers
through staged migrations; Nest 11 remains patch-only under Meta ADR-0010.
Keep TypeBox compatibility evidence until the migration is verified, without
allowing independently authored schemas to evolve in parallel.

If verification fails, retain or restore the last compatible immutable consumer
pin and fix forward in a new package version. Never overwrite a released artifact
or silently change a shared contract inside an implementation repository.

## Tool references

- [Yarn workspaces and published workspace ranges](https://yarnpkg.com/features/workspaces)
- [Nx Conventional Commits](https://nx.dev/docs/guides/nx-release/automatically-version-with-conventional-commits)
- [Nx independent releases](https://nx.dev/docs/guides/nx-release/release-projects-independently)
- [Meta ADR-0012](https://github.com/anarchitects/anarchitecture-meta/blob/main/adr/0012-canonical-public-api-contract-ownership.md)

## Architecture and completion

[ADR-0003](../adr/0003-nx-workspace-and-release-governance.md) supersedes the
historical Changesets/no-Nx choices. This branch implements the workspace, single release authority and the split
release/publish workflows. #8 remains open until signed CI delivery,
independent conformance packaging, trusted publication and clean downstream
consumer evidence exist. Contract runtimes and the standalone CLI must remain
usable without Nx.
