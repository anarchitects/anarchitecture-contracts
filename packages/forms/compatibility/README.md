# Forms compatibility record

## D08 canonical correction — issue #25

The next Forms release targets **0.2.0**. `getFormDefinition` now reuses
`PublicFormDefinitionEnvelopeResponseSchema`; its success response forbids every
delivery field. This is a security-driven breaking wire change from published
0.1.0, not a schema-only documentation correction. Method, path, operationId,
query coercion, default version, errors and protected security binding remain.
Legacy response exports are retained solely for migration comparisons. Frozen
responses are still tested with those legacy schemas; leaked delivery must fail
the new canonical operation and generated response schema.

Protected profiles also name public projection/secret-free serialization and
restricted configuration/historical rotation requirements. No anonymous fallback,
host approval or deployment support is introduced. D05 request acceptance is
unchanged; server-side validation of the exact definition/version before side
effects remains a separate implementation requirement.

Consumers must stop reading delivery through the public endpoint. Bricks #489
has merged; #490 must pin the new published version and verify real HTTP behavior.
Rollback disables the capability or uses a verified secure host; never restore
secret exposure or dynamic validation bypass. See
[the migration requirements](../../../docs/forms-security-migration.md).

## Historical extraction — issue #6

## Scope and review

`@anarchitects/forms-contracts` is an unreleased `0.0.0` workspace with its
initial release fixed at `0.0.1` by ADR-0004. This extraction preserves transport behavior;
it does not approve stable Forms support, fix the implementation or change pins.

Reviewed all 15 Meta ADRs at `e2f34553c6e2492d0ab6f80ac795de44fc592a70` (upstream
main unchanged), both local ADRs at Contracts
`3155a388d4d3482a650bf48b43a9c51933c63aa2`, and the package, release, operation,
schema and baseline guides. Accepted Meta ownership, independent packages and
compatibility-first migration apply. Governance proposals remain proposals;
Native Node evaluation and Nest modernization do not authorize runtime changes.
No conflicting accepted decision was found.

The unchanged [#3 baseline](../../../baselines/legacy-3tier/README.md) pins Bricks
to `ecda1b6e0d9bc39c66373452a92dce91e06abee0`. The four `formsOperations` retain
`getFormDefinition`, `submitForm`, `getSubmissions` and `getSubmission`, including
methods, paths, 200 outcomes and fixture references. No pagination is added.

## Semantics and dispositions

| Finding | Extracted behavior / disposition                                                                                                                                                                                                                                                                                      |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D03     | Every operation requires an unresolved host protection binding. Unguarded fixture success does not imply anonymous access. Preserve 400/404 bodies; host 401/403 and unhandled 500 remain explicit conditional outcomes.                                                                                              |
| D04     | Use tested primitive/singleton-array coercion, open object payloads and unknown body/query properties. Objects do not unwrap from arrays. Preserve legacy UUID grammar, including URN and nil forms.                                                                                                                  |
| D05     | **Stable `forms.submissions` support blocked.** Missing required dynamic fields, invalid email and unknown payload fields reach persistence in the audited implementation. The transport schema preserves the open payload; it does not compile/evaluate the returned dynamic form schema or silently add validation. |
| D06     | Submit formVersion remains required and >=1 after coercion. Definition query omission stays omitted at validation; the controller then supplies 1. The unreachable service default is not a request default.                                                                                                          |
| D08     | **Stable `forms.definitions` support blocked.** The response still contains delivery config and webhook secrets. No automatic redaction or approval of exposure occurs in extraction.                                                                                                                                 |
| D10     | List returns the existing array. Unknown limit/offset queries survive validation; their presence is not a pagination guarantee.                                                                                                                                                                                       |

`formsReleaseBlockers` exports D05/D08 with blocked status and maintainers responsible
for review. Contracts architecture maintainers and Bricks Forms/security maintainers
have accepted the validation/redaction direction. The versioned implementation
migration still needs access-scope and consumer evidence; see the
[Forms migration requirements](../../../docs/forms-security-migration.md).
The existing [3-tier adoption issue #489](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/489)
and its [epic #485](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/485)
own downstream integration. This change opens no separate implementation issue
and does not mark those follow-ups complete. The #7/#8 release gates must consume
these blockers before publishing or advertising the affected stable capabilities.

Responses validate serialized data with strict public projections and required
timestamp strings. They do not convert Date models, default security config,
generate dynamic schemas or perform persistence/mail/webhook delivery. Field
configuration crosses HTTP as transport data; domain models and invariants stay
in Bricks. URI grammar is adapted from the audited AJV format with its MIT notice
in the package license; no AJV runtime dependency is shipped.

## Evidence and limits

Shared tests validate 55 frozen Forms/Newsletter HTTP responses without mutation,
including headers, and compare expanded Forms body/query/path inputs against
AJV 8.17.1 with the pinned Fastify options. Domain tests compare URI/email formats,
response shapes and date serialization boundaries. TypeBox is only a development
oracle for Newsletter, never an independent evolving contract source.

The [supplemental HTTP record](../../newsletter/compatibility/legacy-http.json)
contains 23 pinned-source probes. Forms repeated version queries return 400.
A string version of `"Infinity"` is accepted and normalized to positive infinity
by AJV, unlike a numeric infinity input. It reaches the application and later
fails response serialization with `{statusCode:500,message:"Internal server error"}`.
The canonical request parser preserves acceptance and the response registry
includes that error envelope. The legacy audit recorder itself JSON-serializes
non-finite event values to null; that null is not the mapper-facing value.

Local clean packed consumers pass ESM/CommonJS on Node 22.13.0/24.21.0,
TypeScript 5.5.4/6.0.3 with strict NodeNext/bundler resolution, and browser bundling.
All public exports are exercised outside the workspace; only Zod is installed as
a runtime dependency. CI runs the same package/runtime checks.

Native input conversion has decoded non-finite and post-coercion gaps. The #7
generator implements faithful constraints and scoped reviewed exceptions; no
`{}` fallback or legacy validation change is authorized. Resolved
host authentication/authorization, actual provider/storage behavior and the
D05/D08 security decisions are not proven by schema tests. Publication/provenance
and independent conformance remain #8; package existence is not adoption.

## Issue #7 generation status

Generated JSON/YAML review artifacts, inventories and package manifests now exist.
The [generation guide](../../../docs/openapi.md) and
[reviewed, scoped projection register P07](../../../docs/openapi-projection-proposal.md)
record faithful constraints, remaining exceptions and strict profile/evidence gates.
Synthetic verification is test-only; actual host evidence and capability blockers
remain outstanding. Existing legacy parsers and frozen HTTP observations are
preserved. #7 can complete independently of host remediation and #8 publication.

## Issue #23 reviewed release delta

The [issue #23 migration approval](../../../docs/reviews/23-migration-approval.md)
covers both the PR baseline and the immutable `0.0.1` release baseline. The
approved next release intent is `0.1.0`, derived through Nx Conventional Commits;
this note does not materialize or publish a version.

This package changes generated projection-review provenance and artifact digests,
without changing canonical runtime sources, operations or wire constraints. The
conservative compatibility gate requires the approved minor release for that
metadata delta; host-conformance obligations remain unchanged.
