# Package and release conventions

## Foundation status

The repository root is private and cannot be published. No public package exists
yet. Changesets is configured for independently versioned, public npm packages;
there are no fixed or linked version groups, automatic commits or private-package
tags. CI has read-only repository permissions and no publish job or credentials.

This document defines the required release process. Executable publication,
provenance and installed-consumer validation are delivered in
[issue #8](https://github.com/anarchitects/anarchitecture-contracts/issues/8).
Do not treat foundation CI as a substitute for those release gates.

## Changes and compatibility

Once packages exist, include a `yarn changeset` entry for each public package
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

`yarn changeset:status` needs a committed `HEAD` and a fetched `origin/main` base. It
inspects pending entries without changing files or publishing, and detects
changed versionable packages when no changesets exist. It does not prove that
every affected package has the correct bump. Complete package-aware PR
enforcement and semantic compatibility diffs must be added with
[issue #7](https://github.com/anarchitects/anarchitecture-contracts/issues/7).

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
foundation and no release is made as part of issue #2.

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
