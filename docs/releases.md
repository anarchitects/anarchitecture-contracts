# Package and release conventions

## Current status

The repository root is private and cannot be published. All four domains now
have unreleased workspaces at `0.0.0` and pending minor Changesets for `0.1.0`.
No package is published or approved for deployment. Changesets is configured for
independently versioned, public npm packages;
there are no fixed or linked version groups, automatic commits or private-package
tags. CI has read-only repository permissions and no publish job or credentials.

This document defines the required release process. Executable publication,
provenance and installed-consumer validation are delivered in
[issue #8](https://github.com/anarchitects/anarchitecture-contracts/issues/8).
Do not treat current CI as a substitute for those release gates.
[ADR-0002](../adr/0002-domain-contract-authoring-and-publishing-boundaries.md)
defines four independent domain packages, their module/authoring design and
cross-domain dependency rules. Issues #5/#6 add the four packages and initial
release entries. Their installed-consumer checks are an early subset of #8;
request generation and resolved host profiles remain explicit release blockers.

Issue #7 now supplies [deterministic generation and compatibility gates](openapi.md).
Generated files are review-only until the [bounded projection proposal](openapi-projection-proposal.md)
and real host profiles are approved. Package-aware PR checks require new release
intent for each affected package and matching migration evidence for breaks;
these gates do not enable publication.

## Changes and compatibility

Include a `yarn changeset` entry for each public package
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
do not use `0.x` as permission for silent drift. Publish stable public contracts
as `1.0.0` only once the initial compatibility and conformance gates pass.

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
Changesets prerelease mode and the non-`latest` dist-tag must be deliberate. At
and after 1.0, breaking changes require a major release. A security-driven wire
change still needs explicit disclosure and coordination; it is not a silent patch.

Versions are per npm package, not per endpoint, capability subpath, repository
commit or aggregate OpenAPI document. A passkey change versions Auth; a native
action change versions Newsletter. The other domains do not bump unless their
published code, types, dependencies, artifacts or compatibility commitments change.
There are no fixed/linked Changesets groups and no runtime meta-package that
forces all four domains to upgrade together.

Cross-domain references require a reviewed acyclic dependency on an owning public
wire export. Workspace ranges must become tested published SemVer ranges in the
tarball; release dependencies before dependents. The generated manifest records
exact resolved versions/digests. If a dependency changes incompatibly, its
dependents must assess their own public surface and bump deliberately; neither
the dependency's major number nor an automatic Changesets patch is sufficient
evidence. See [package conventions](../packages/README.md#cross-domain-references).

Package SemVer does not automatically add `/v2` paths or change HTTP headers.
A breaking wire migration must separately define how old/new clients and host
deployments coexist, which pins remain supported and how rollback works.
Unresolved [baseline blockers](baseline-dispositions.md) prevent the affected
stable capability claim; a new package version cannot bypass them.

`yarn changeset:status` needs a committed `HEAD` and a fetched `origin/main` base. It
inspects pending entries without changing files or publishing, and detects
changed versionable packages when no changesets exist. It does not prove that
every affected package has the correct bump. The #7
`yarn openapi:compatibility <base-ref>` gate now checks affected packages against
their exact base, rejects insufficient release intent, and requires explicit
migration records for conservatively classified breaks.

## Release sequence and evidence

1. Complete the frozen API inventory and discrepancy review before extraction.
   Acceptance of Meta ADR-0012 does not by itself prove compatibility.
2. Run immutable installation, foundation checks and every package's build,
   type and behavioral checks. Reproduce and validate OpenAPI 3.1 with no generated
   drift. Compare against the previous released contract or frozen first-release
   baseline, including negative and security fixtures.
3. Prepare versions and changelogs from Changesets in a reviewed release change.
   Review independent dependency bumps; a shared dependency's breaking change
   can require consumer package changes even when its own source is unchanged.
4. Pack each changed package and verify its contents, license, exports,
   declarations, module formats, dependency ranges and clean installed-consumer
   behavior outside the monorepo. Resolve workspace references in shipped
   manifests; no local paths or mutable Git branches are release dependencies.
5. Publish the reviewed artifacts to npm with public access and provenance from
   the verified source revision. Record package name/version, source commit,
   package-specific tag (`<package-name>@<version>`), integrity and CI evidence.
   Prereleases use an explicit prerelease version and non-`latest` dist-tag.
6. Update each consumer to an exact released version or a documented immutable
   artifact pin with integrity evidence. Verify actual HTTP behavior against
   that same version before marking a capability supported.

Actual publish commands and credential/trusted-publisher configuration must be
implemented and validated in issue #8. There is no publish command in this
workspace and no release is made as part of issues #2–#6.

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
- [Changesets configuration](https://github.com/changesets/changesets/blob/main/docs/config-file-options.md)
- [Meta ADR-0012](https://github.com/anarchitects/anarchitecture-meta/blob/main/adr/0012-canonical-public-api-contract-ownership.md)

## Accepted Nx Release migration (target for issue #8)

[ADR-0003](../adr/0003-nx-workspace-and-release-governance.md) **supersedes Changesets as the permanent release authority** and requires Nx/`@nx/js` for repository build orchestration. The Changesets process described in this document is **the currently implemented transitional process only**. Issue #8 must map all outstanding Changesets intent to independently versioned Nx Release plans, then replace the scripts, workflows, release commands and this runbook in the same controlled cutover. No concurrent long-term versioning or publishing mechanisms are permitted. Published contract packages and the standalone conformance CLI remain usable without Nx. Until #8 implements and verifies the switch, do not claim Nx Release or npm publishing is operational.
