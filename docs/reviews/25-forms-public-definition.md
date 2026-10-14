# Issue #25 — canonical Forms D08 response correction

## Architecture preflight

Reviewed all 16 Meta ADR files at `a66c525132cab0e59d12d55a92bb0d1830953f8e`,
verified against upstream main, and all five Contracts ADRs at
`313ffcb1116c86e747f406f8f896f69fabbf1f11`. `adr/` is the only documented local
ADR location. Accepted, proposed, partially superseded and historical records
were read, including both Meta ADR-0001 and ADR-0008 subjects and ADR-0001.md.
Read AGENTS, package/schema/operation/release conventions, baseline dispositions,
Forms compatibility and security migration, OpenAPI generation and P07 guidance.

Applicable decisions: Meta ADR-0012 owns canonical wire schemas/operations here;
ADR-0013 and Contracts ADR-0004 require exact Nx scopes and independent versions
from Conventional Commits. Contracts ADR-0002 requires one Zod source, explicit
security and compatibility; ADR-0005 separates publication from host/deployment
conformance. HTTP independence and safe migration apply. Proposed governance
records introduce no implementation requirement. Historical Changesets/version
plans are superseded. No accepted conflict requires a new ADR.

The stale operation conflicts with the already accepted safe D08 direction.
The maintainer explicitly authorized issue #25, its dedicated feature branch and
PR, a versioned security-driven response removal, and preserved legacy exports.
Merge and publication are not authorized. D05 validation stays a separate host
obligation. No Nest 12-native or provider modernization is included.

## Contract change and evidence

`getFormDefinition` reuses the existing public envelope, rejecting all delivery
configuration. No duplicate schema or silent parser redaction is introduced.
The protected profile requires public projection/secret-free serialization and
restricted delivery configuration/historical rotation. It retains authentication,
resource authorization, unresolved bindings, empty supported capabilities and
D05/D08 host blockers. Published 0.1.0 and the frozen baseline remain immutable.

Tests preserve historical responses using the retained legacy schema, explicitly
assert the D08 incompatibility at the new operation, check safe/leaked payloads
against generated OpenAPI, and check packed ESM/CommonJS consumption. D05 request
and semantic definitions are unchanged; existing differential coverage remains.

## Review and release gates

The six Forms P07 entries have unchanged scopes, limitations, faithful conversion
records and generator pins. The exact source digest is now approved in the
maintainer record below; [25-p07.draft.json](25-p07.draft.json) preserves the
approved review input. Only the six corresponding active register entries were
re-pinned. No generator gate was bypassed.

PR base and latest Forms 0.1.0 tag both resolve to
`313ffcb1116c86e747f406f8f896f69fabbf1f11`; one exact comparison baseline suffices.
The expected Forms release is 0.2.0, derived through a breaking
`fix(forms-contracts)!` commit. The shared P07 register digest is embedded in all
package manifests; compatibility review must disclose any collateral artifact
metadata changes separately from the actual Forms wire change.

After review/merge, use Release (Manual) and the existing immutable-tag Publish
workflow. Do not manually version packages or dispatch either workflow here.
Bricks #489 is merged; #490 remains prepared independently. It must pin the new
published Forms version and verify actual HTTP behavior before claiming full
Forms conformance. Rollback disables an affected capability or uses a verified
secure host; it cannot restore secret exposure or D05 bypass.

Potential npm deprecation of older Forms versions remains a maintainer proposal:
the unsafe normative response warrants review, but no npm deprecation is performed
or authorized by this change.

## Local validation before P07 review

Node 24.21.0, Yarn 4.18.1, macOS arm64:

- Immutable installation passed.
- Forms package tests and shared differential tests passed, including 572 Forms
  input cases and 352 Newsletter cases; frozen observations were not rewritten.
- Full `yarn check` exercised builds, types, baseline and packed-consumer checks.
  OpenAPI verification/tests and release artifact preparation fail closed on
  `unreviewed source bytes` for the changed Forms P07 source digest. Consequently,
  generated OpenAPI/manifests and exact compatibility findings cannot yet be
  finalized. The PR stays draft pending the explicitly requested source-pin review.
- No release, publication, npm deprecation or host approval was executed.

## Explicit maintainer P07 approval — 2026-10-14

Johan Vrolix explicitly approved option 1 in the task conversation:

> I explicitly approve re-pinning the six existing Forms P07 review records to source digest:
> 73653e350f0cebeab8cd4ff5d45b7a6addfe36f5a5129433991d59bd1f64278d

Approval applies exclusively to the six candidates in `25-p07.draft.json`.
The maintainer confirmed unchanged exception scopes, limitations, generator
hashes and validation semantics, and requested promoting these records to reviewed,
regeneration, complete validation and disclosure of collateral package changes.
The draft is retained as the exact approval input; the active P07 register now
contains the reviewed pins. Existing review owners/decisions and evidence remain
unchanged; this document records the specific source-pin approval.

This approval does not authorize PR #26 merge, Forms 0.2.0 publication,
deprecation of previous versions or host conformance. Exact compatibility migration
records and their package impact remain separately reviewable. No other P07 entry
or generator pin is approved or changed by this action.

## Regeneration impact before classifier correction (historical)

The active register changes exactly six `sourceDigest` fields, all in Forms.
Every other field, domain entry and generator pin is unchanged. The complete
register digest changes from
`15efd442745207df84e6f69156ec9bad251e0c9a00949e7b5bfc99c51fbce5d3` to
`4d07b2bbab95465392f026b45baf7c8f23cefb5fbda9f8b8c60a7b478a1e3a43`.

| Package    | Regenerated impact                                                                                              | Nx preview | Current gate minimum             |
| ---------- | --------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------- |
| Forms      | Public definition response, protected-profile obligations, source/review metadata and derived OpenAPI/inventory | 0.2.0      | 0.2.0 + exact migration approval |
| Auth       | Only `contract-manifest.json` → `projectionProposal.digest`                                                     | 0.1.1      | 0.2.0 + exact migration approval |
| Identity   | Only `contract-manifest.json` → `projectionProposal.digest`                                                     | 0.1.1      | 0.2.0 + exact migration approval |
| Newsletter | Only `contract-manifest.json` → `projectionProposal.digest`                                                     | 0.1.1      | 0.2.0 + exact migration approval |

The other three packages have byte-identical schemas, runtime sources, operations,
OpenAPI JSON/YAML, inventories, own projection reviews and generator identity.
Their reported breaking impact is the conservative comparator's treatment of the
shared review-register digest, not a runtime wire break. No independent package
version or release is materialized by regeneration. Do not silently change the
classifier or insert breaking commit intent for unrelated packages to hide this.

The initial `25-migrations.draft.json` contained five pending records (retained
in Git at `a768383`, never approved): all four packages versus PR base `313ffcb`, plus Auth
versus its last release `b422b54`. Forms/Identity/Newsletter 0.1.0 tags already
coincide with `313ffcb`. These distinct checks protect PR-local and cumulative
release changes; Auth has identical findings in both comparisons. Draft records
are not active approvals. The maintainer's current approval is limited to P07.

## Validation after approval

- `yarn openapi:generate`: passed; all canonical and diagnostic artifacts generated
  from sources, with no hand-edited OpenAPI or manifest statuses.
- `contract-checks:verify` dependencies passed: deterministic OpenAPI verification,
  all 30 OpenAPI/profile/fidelity tests, 21 shared contract tests, package tests,
  baseline, types/builds, Markdown/format checks and clean packed consumers.
- Packed consumers passed ESM/CommonJS on Node 24.21.0, TypeScript 5.5/6 with
  NodeNext/bundler resolution, and browser bundling.
- All 18 release unit tests passed. `yarn check` nevertheless fails its release
  smoke dry run: Auth requires minor while Nx proposes 0.1.1. The separate
  `yarn openapi:compatibility origin/main` reports the same gate. Full green
  validation and final release eligibility are not claimed.
- An initial overlapping invocation transiently removed a declaration during
  rebuilding. The full suite was rerun without concurrent Nx commands; that
  transient failure did not recur. The remaining failure is the version gate.
- P07, D05/D08 host blockers, unverified implementation/deployment status and empty
  supported capabilities remain enforced. No merge, publish or deprecation ran.

## Classifier correction requested after impact review

The maintainer declined approval of the five breaking migration records and
requested distinguishing normative contract changes, package artifact changes and
unrelated shared provenance. Revisited the unchanged ADR inventory and release/
compatibility guidance for this tooling scope: independent SemVer and strict
migration/P07 verification remain required; no ADR or generator change is needed.

The correction is deliberately bounded: only a valid P07 register digest refresh
with identical package-local reviews and unchanged register identity/approval
state is patch provenance. The manifest is distributed, so its changed bytes
warrant patch; identical manifests produce no finding. Changes to local review
pins or exception meaning, schemas, operations, security, approvals and host
attestations remain conservatively breaking. Generation/publication continue to
reject stale source/generator pins, changed limitations and forged artifact bytes.
The classifier grants neither P07 approval nor migration approval.

## Corrected per-package report and Nx preview

The [before/after report](25-compatibility-report.json) compares every package
against its exact published 0.1.0 commit and the PR base. Auth is checked against
both `b422b547501d0db7291e759f8f941c5b646f7e37` (its release) and
`313ffcb1116c86e747f406f8f896f69fabbf1f11` (PR base). The other packages use
`313ffcb` for both. Findings are identical for Auth's two baselines.

| Package    | Previous classifier minimum | Corrected minimum                                      | Actual Nx preview |
| ---------- | --------------------------- | ------------------------------------------------------ | ----------------- |
| Forms      | Minor                       | Minor; D08 response/security migration review required | 0.2.0             |
| Auth       | Minor                       | Patch; only distributed shared-register digest changes | 0.1.1             |
| Identity   | Minor                       | Patch; only distributed shared-register digest changes | 0.1.1             |
| Newsletter | Minor                       | Patch; only distributed shared-register digest changes | 0.1.1             |

The [Nx preview](25-nx-preview.json) is output from the existing public Nx Release
helper in dry-run mode, not a version plan or independently calculated intent.
The unchanged-manifest regression yields no finding or minimum bump; these three
patches are justified by actual distributed manifest changes. No package manifest
version, tag or published artifact is rewritten. The classifier itself is private
`contract-checks` tooling and does not alter generated bytes or P07 generator pins.

The declined five migration records have been replaced with a single pending
Forms record in [25-migrations.draft.json](25-migrations.draft.json), matching the
corrected exact findings. One record covers Forms' identical PR and release base.
Auth, Identity and Newsletter no longer need breaking migration approvals.
Forms findings digest:
`131d54a093a4285f6f3f5dc5fb28f4eaec86bd26c1232800272d0473480c5bc1`.
This is not yet approved; review is requested after the classifier correction.

Validation: all 35 OpenAPI/profile/fidelity/classifier tests and the complete
`contract-checks:verify` target pass, including deterministic bytes, packed
consumers and negative P07 integrity checks. Final release compatibility must
still reject the pending Forms migration until the maintainer reviews this exact
record. Neither a sufficient Nx version nor the earlier P07 approval substitutes
for that review. Merge, release, publish, deprecation and host claims remain
separate gates.
