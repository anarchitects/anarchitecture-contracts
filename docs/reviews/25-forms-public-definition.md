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
records and generator pins. Their source digest must be reviewed for the updated
operation metadata; candidates are in [25-p07.draft.json](25-p07.draft.json).
Draft records are not approvals. No generator gate may be bypassed.

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
