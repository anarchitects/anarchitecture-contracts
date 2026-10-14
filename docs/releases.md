# Package and release conventions

## Current status

The private root and verification tooling are excluded from release. The four
contract packages have signed `0.0.1` tags from the 2026-10-14 release run.
That run initially created no GitHub Releases. npm publication was completed
manually, and the missing GitHub Releases were subsequently recovered on the
existing tags with explicit user authorization; see [the recovery evidence](reviews/23-npm-staging-history.md).
Existing tags are release history and must not be recreated or moved.
Nx 23.3.0 / `@nx/js` orchestrate
builds and checks, and **Nx Release is the only configured versioning authority**.
[ADR-0004](../adr/0004-package-initial-release-and-nx-versioning.md) makes
Conventional Commits the bump authority. Initial development uses non-bumping
`init(<exact-nx-project-name>)`; explicit first distribution is exactly `0.0.1`.
Historical Changesets and version-plan rationale is retained in the
[migration record](nx-migration.md), not consumed by release tooling.

The Community-style `release.yml` and `publish.yml` workflows now prepare signed
independent releases and publish from immutable tagged commits. They are pipeline
implementation, not completed publication evidence for [issue #8](https://github.com/anarchitects/anarchitecture-contracts/issues/8).

[ADR-0005](../adr/0005-independent-contract-publication-and-implementation-conformance.md)
separates **contract validity**, **implementation conformance** and **deployment
compliance**. Gate A publishes valid canonical contracts with no host evidence or
supported-capability claim. Gate B remains strict for host-resolved profiles,
security/runtime evidence and approved deployment claims. Forms D05/D08 block
those affected host claims, not independent package distribution.

The publication integrity gate regenerates canonical artifacts from current Zod
and operation sources, enforces P07, matches exact bytes/versions/exports and
rejects host-support claims in package manifests. Nx schedules build/type/schema,
behavior and packed-consumer checks; compatibility uses actual Nx-proposed versions
and pinned migration review. Scoped publishing skips target dependencies, so the
publish workflow explicitly invokes verification, compatibility and publication
checks before the standard `@nx/js:release-publish` executor.

Synthetic verification grants no host approval and cannot substitute for canonical
package validation. Historical review-only and host-test artifacts are not
canonical publication candidates. See [manifest states and generation](openapi.md).

## Changes and compatibility

Use lifecycle-appropriate Conventional Commits for each public package
change. Document affected operations, wire behavior, compatibility reasoning and
required migration steps. Foundation-only documentation/tooling changes need no
package version bump.

| Bump at/after 1.0 | Rule                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Patch             | Compatible correction with no break to supported wire behavior or package exports. Fixing an implementation discrepancy is not automatically wire-compatible. |
| Minor             | Backward-compatible capability addition, verified against existing consumers. An added field or enum value is not automatically compatible.                   |
| Major             | Breaking wire or package API change, with an explicit reviewed migration and downstream coordination.                                                         |

Request constraints, required fields, response shapes, status codes, errors,
authentication, authorization, headers, cookies, operation IDs and exported types
are all compatibility surfaces. Assess both request and response directions.
Preserve the audited baseline unless a deliberate versioned change is reviewed.
Pre-1.0 releases still require explicit breaking-change disclosure and migration;
do not use `0.x` as permission for silent drift. First distribution must be `0.0.1`, with all contract compatibility and publication gates
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
| Add an operation or optional field                                                                                  | Minor after 1.0, patch before 1.0, only with verified compatibility; capability absence remains explicit             |
| Add missing metadata for an existing operation before its first canonical release                                   | First-release reconciliation, with provenance; do not claim the old generated spec was complete                      |
| Correct documentation or generator output without changing supported semantics, IDs or public types                 | Patch with artifact and consumer evidence; a “bug fix” label alone is insufficient                                   |
| Update Zod or a cross-domain dependency                                                                             | Assess every affected domain's parsing, types and generated artifacts; unchanged source does not prove compatibility |

During `0.x` development, document breaks and use a new minor line
(for example `0.2.0-next.0` after `0.1.x`); compatible corrections use patch and
compatible additions also use patch. Never disguise a break as an ordinary patch.
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

`adjustSemverBumpsForZeroMajorVersion: true` explicitly follows the Nx 23 default,
as used by Bricks 3-tier, Community and Plugins. Before 1.0, compatible `feat`
and `fix` commits produce patch releases; `!` or `BREAKING CHANGE` produces a
minor release. At and after 1.0, features produce minor and breaks produce major.
The compatibility gate uses the same minima and still requires exact reviewed
migration evidence for breaking findings, including changed normative contract
artifacts or package-local pinned review obligations. A shared P07 digest-only
refresh with unchanged local reviews is patch provenance when the distributed
manifest changes; it does not force unrelated breaking releases. Exact P07
approval and artifact integrity gates remain independent and mandatory. A conservative finding is not proof
of a runtime wire break; disclose its actual surface instead of inventing one.
Neither ADR-0004 nor Meta ADR-0013 requires the previous `false` override.
Explicit specifiers are resolved by Nx and checked against its
Conventional Commit preview; they cannot change the derived major/minor/patch
version. There is no second bump calculator.

`yarn openapi:compatibility <base-ref>` compares package surfaces against the
exact base and validates Nx's actual proposed version. Unreleased development
remains at `0.0.0`; the explicit first-release operation selects `0.0.1`.
Baseline/migration checks still run for unreleased work. At release time the
cumulative delta is also compared against the last package tag, and any breaking
migration record must match that release baseline and findings. When the PR base
and last release differ, store their separately approved records together in the
per-domain migration array. Neither approval substitutes for the other; the gate
requires exactly one matching record for each comparison.

```sh
yarn nx show projects
yarn commits:check origin/main
yarn release:dry-run                      # ordinary preview; init does not bump
yarn release:dry-run --first-release      # explicit initial 0.0.1 preview
yarn test:release
yarn openapi:compatibility origin/main
```

The remote history check recognizes only the four inspected, integrity-pinned
npm `0.0.0-stage` holding packages recorded in
[the staging audit](reviews/23-npm-staging-history.md). npm creates these automatically
when staging a new package. They are not contract releases or a replacement for
`0.0.1`, and no fictitious Git tags are created for them. Unknown placeholders and
all genuine distributed versions still require history reconciliation.

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

The helper uses a public Nx `ReleaseClient` override enabling
`changelog.projectChangelogs.createRelease: "github"` and the required Git push
configuration. A `createRelease: "github"` changelog argument does not enable a
provider: that argument only disables creation when `false`. Generic Nx commands
retain the inert defaults in `nx.json`; the guarded release helper explicitly
controls signed Git actions. It passes version data to the configured changelog
client but rebuilds the release graph so the version client's disabled remote
release settings cannot leak into it. Dry runs preview GitHub Releases without
writes. See [Nx's public API](https://nx.dev/docs/guides/nx-release/programmatic-api)
and [GitHub Release configuration](https://nx.dev/docs/kb/automate-github-releases).

Nx owns package `CHANGELOG.md` bytes. Only `packages/*/CHANGELOG.md` is excluded
from Prettier and Markdown lint; authored documentation remains checked. This
preserves existing release records and handles subsequent Nx-generated entries.

**Publish** runs on `release.published`, or manually with an existing published
release tag. It validates the tag/project, requires GitHub-verified tag and commit
signatures, checks out the resolved commit SHA and requires ancestry on `main`.
It runs every functional target from `contract-checks:verify`: baseline,
behavioral and package tests, deterministic OpenAPI, OpenAPI/security tests and
packed consumers, including prerequisite builds/typechecks. Formatting and
Markdown lint remain CI/release-preflight checks; prose style does not block
immutable artifact replay. It then runs
compatibility against the previous package tag (the release commit's parent for
a first release), and `<project>:publication-check`. The tag, package and manifest
versions must agree. Only then does it invoke scoped `nx release publish` with
OIDC/provenance. Concurrency serializes replay of the same tag; Nx detects an
already-published version rather than overwriting it. Manual replay does not
create tags or approve an unpublished GitHub Release.

### Recover tags pushed without GitHub Releases

The 2026-10-14 run pushed `auth-contracts@0.0.1`, `forms-contracts@0.0.1`,
`identity-contracts@0.0.1` and `newsletter-contracts@0.0.1` at
`1f8240b62b5533b136610ea44ebf16fe6b7efae4`. The original release commit also exposed
a test fixture that assumed unrelated packages stayed at `0.0.0`, and prose
checks incompatible with Nx's generated notes. These are tooling defects, not
permission to alter tagged artifacts or to skip contract validation.

After the correction is reviewed and merged, recovery is a separately authorized
publication operation:

1. Verify the existing annotated tag and release commit signatures, main ancestry,
   package/manifest versions and canonical artifact integrity. Retain the original
   tag and commit. Do not rerun first-release versioning or bump to `0.0.2` as a
   workaround for the missing `0.0.1` distribution.
2. Create each missing GitHub Release using its existing tag and its committed
   package changelog. Review the release notes and npm trust/environment setup
   first: publishing a GitHub Release can trigger npm publication.
3. The old tag contains the old Publish workflow. Its automatic run may fail the
   historical prose checks. Use **Publish → Run workflow → main**, supplying the
   existing published tag, to run the corrected workflow. It still resolves the
   signed tag to its immutable commit and runs the full functional contract suite
   from that commit; it does not substitute packages or tools from current main.
   The release-test fixture is exercised by CI, not by the publication suite.
4. Confirm registry version/integrity/provenance and a downstream clean install
   before recording publication as complete. Replay one package at a time.

For example, after authorization and GitHub Release publication:

```sh
gh workflow run publish.yml --repo anarchitects/anarchitecture-contracts \
  --ref main -f tag=auth-contracts@0.0.1
```

This command publishes; it is not a diagnostic dry run. The documented recovery
does not claim it has been executed. See GitHub's
[event references](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#release)
and [workflow ref selection](https://cli.github.com/manual/gh_workflow_run).

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

### Canonical artifact preparation

1. Review selected package changes and compatibility; before first distribution use
   `init(<exact-nx-project-name>)`, afterward normal Conventional Commits.
2. Run `yarn check` and `yarn openapi:compatibility origin/main`. Canonical generation
   needs no host profile; do not manually copy or edit manifests.
3. Preview with `yarn release:dry-run --projects auth-contracts --first-release`.
   Nx supplies exactly `0.0.1`; the helper verifies existing canonical bytes and
   generates the proposed version's artifacts in memory without writing or publishing.
4. A separately authorized live workflow applies Nx's proposed versions, generates
   canonical artifacts for them, verifies reproducibility/consumers/compatibility,
   and checks Gate A again before signed commit/tag and GitHub Release creation.
5. Publish checks the verified immutable release revision and exact tag/package/
   manifest version, then uses npm trusted publishing/provenance. Rebuilding never
   switches artifacts back to review-only mode.
6. Bricks consumes the published version and proves actual HTTP behavior; hosts then
   provide approved profiles. Publication itself creates no support/deployment claim.

Select only ready packages; no fixed release group forces other domains to release.
The full repository CI remains a shared regression check. Individual publication
eligibility depends on that package's canonical artifacts, not another host's progress.

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
A live release requires verified canonical package artifacts and unchanged branch
protections. Host profiles are not a publication prerequisite. Signing credentials
and npm trust still need independent live verification.

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

External release delivery and downstream adoption still require:

- Live verification of signed release automation and immutable-tag trusted
  publishing with the approved credentials and unchanged branch protections.
- An independently consumable conformance CLI/fixtures with actual positive,
  negative and security-sensitive HTTP checks. Current offline fixture checks
  do not establish deployed host conformance. This is a downstream support gate,
  not a prerequisite for canonical package publication.
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
release/publish workflows. #8 is historically closed, but closure did not supply live publication evidence.
Issue #20 corrects its coupled publication gate; live delivery and downstream
conformance evidence remain separately required. Contract runtimes and the standalone CLI must remain
usable without Nx.
