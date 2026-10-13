# Proposed exception P07: legacy input projections

**Status: Proposed — not approved for release.** Prepared at the maintainer's
request during issue #7. Approval of preparation is not approval of this exception.
Owners: Contracts architecture maintainers and the affected domain/security
maintainers. Review the generated inventories and counterexamples before deciding.

## Decision requested

Permit a bounded OpenAPI input projection for the existing legacy-compatible
parsers, with canonical Zod validation and operation semantics remaining mandatory.
The OpenAPI schema alone would describe a broader input language in the cases
below. Consumers could not use it as a complete replacement for those parsers.
This is a proposed exception to
[ADR-0002, decision 4](../adr/0002-domain-contract-authoring-and-publishing-boundaries.md)
and [schema authoring](schema-authoring.md#normalization-and-generation), which
require faithful input representations or a reviewed exception.

The current implementation generates **review-only** artifacts to make this
decision concrete. It does not enable the exception in release mode, alter any
canonical parser, approve a host profile, or change a runtime implementation.
Keeping affected operations excluded from releasable OpenAPI remains the default.

## Exact scope and consumer impact

| Gap                                       | Affected inputs                                                                                                                   | Proposed projection and retained obligation                                                                                                                                                                                                                  |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Decoded numeric overflow                  | Auth, Forms and Identity coercion; open JSON extras including Newsletter honeypot/webhook                                         | Project the existing finite-number sibling of the narrowly scoped overflow union. JSON exponent overflow such as `1e309` requires canonical parsing after decoding; OpenAPI does not describe JavaScript infinity normalization.                             |
| Pipelines and post-conversion constraints | Auth string/integer/array coercion and passkeys; Identity null/string normalization and identifiers; Forms strings/version checks | Emit the native input view. Field constraints after normalization, integer conversion failures and exact parsed values still require the canonical pipeline. For example, the review projection accepts a one-character login password while Zod rejects it. |
| UTF-16 length                             | Newsletter email/source/version/website fields and native tokens                                                                  | Preserve the native code-point `maxLength` projection and disclose the additional canonical UTF-16 check. A token of 65 emoji passes projected `maxLength: 128` but fails the legacy-compatible parser.                                                      |
| Conditional payload refinements           | Newsletter webhook event/type consistency, subscriber fields, timestamp parsing/fallbacks and batch discrimination                | Emit native structural fields and retain the canonical whole-payload checks after raw-byte verification. An unsubscribe event without subscriber data passes the structural projection but fails canonical validation.                                       |

The immutable source-byte scope and custom-function fingerprints are in
[projection-proposal.json](../tools/openapi/projection-proposal.json).
Each affected generated component carries `x-contract-projection` with the
proposal ID, proposed status and exact graph locations. Manifests list every
affected component. Unexpected source bytes or custom functions fail generation;
there is no arbitrary `{}` fallback or separately authored input schema.

Request parsing and response serialization are different boundaries. Response
schemas still use native output conversion. Generated output schemas are tested
against the frozen HTTP responses and relevant header values. A matching output
does not establish request equivalence or runtime security conformance.

## Proposed conditions of acceptance

1. Record a maintainer decision identifying approved domains, operations and exact
   source/proposal digests. A status edit alone is insufficient: release-mode
   implementation and tests must be reviewed in the same follow-up.
2. Keep the projected input language and canonical input/parsed-output types
   visibly distinct. Require consumers to retain the canonical parser; client
   generation must not be advertised as complete server validation.
3. Preserve all existing parsing/differential and HTTP evidence tests. Keep the
   executable non-equivalence examples in
   [openapi.test.mjs](../tools/openapi/openapi.test.mjs).
4. Resolve each actual host's security and behavior bindings independently, with
   deployment evidence. Review inventories are not approved deployment profiles.
5. Keep Forms D05/D08 blocked. This exception cannot approve dynamic-validation
   bypass, delivery-secret exposure, anonymous access, HMAC omission or other
   security changes.
6. Revisit before the first publication in #8 and on any affected parser,
   converter, dependency, profile or consumer validation change. A faithful
   representation should replace an exception when demonstrated without changing
   wire acceptance. Any wire change requires a separate migration/version plan.

## Review evidence and unresolved decisions

The [aggregate manifest](../generated/contract-manifest.json) records 29 inventoried
operations. Fourteen public operations appear in the
[review OpenAPI](../generated/openapi/aggregate-review.json); fifteen protected
operations remain in the [inventory](../generated/openapi/inventory.json) with
their unresolved security bindings. No generated profile claims supported
capabilities. Forms and Identity review documents have empty `paths` deliberately.

The review documents are not a complete specification for deploying all 29 routes.
The generator can emit all 29 only when explicit bindings are supplied; tests
exercise that path using clearly synthetic bindings, without approving them for
production. Release mode currently rejects both this proposal and unresolved
profiles. #7's complete releasable-profile outcome remains pending these decisions.

All 15 Meta ADRs were reviewed at
`e2f34553c6e2492d0ab6f80ac795de44fc592a70`, matching upstream, and all three local
ADRs at `82a5c1e`. Accepted ownership, platform independence and compatibility
requirements apply. Governance proposals remain contextual; no runtime/provider
modernization is authorized. Accepted ADR-0003 assigns the Nx Release cutover to
issue #8; the current Changesets adapter is transitional only.
