# Baseline dispositions for extraction

This design register follows
[ADR-0002](../adr/0002-domain-contract-authoring-and-publishing-boundaries.md)
and refers to D01–D11 in the immutable
[legacy discrepancy register](../baselines/legacy-3tier/semantics.md#discrepancy-register).
It does not edit the baseline or claim that any runtime defect is fixed.

“Preserve” directs a compatible extraction. “Document” fills an artifact gap
without changing the wire. “Blocked” means the affected stable capability cannot
be published or claimed adopted until its owning issue records an explicit
decision and evidence. Other domains can progress independently. No row authorizes
an implementation/provider replacement or a silent breaking fix.

| Finding                                  | #4 disposition                                                                                                                 | Delivery owner                                  | Evidence / release condition                                                                                                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01: three JWT routes absent from spec   | Document all three under `auth.jwt`; assign `loginWithJwt`, `logoutWithJwt`, `refreshJwtTokens`                                | #5 Auth extraction, #7 generation               | Same methods, paths, schemas and observed statuses; add ID uniqueness and JWT fixtures. Document IDs as newly assigned, not historical.                                                                  |
| D02: obsolete refresh metadata           | Exclude the route and orphan `refreshTokens` ID from canonical operations                                                      | #5, #7                                          | Keep the legacy 404 fixture; do not redirect or alias it to the plugin route.                                                                                                                            |
| D03: absent errors/security/headers      | Document explicit outcomes and security/profile requirements; unresolved host policy blocks the affected profile               | #5/#6 domain owners, #7                         | Error-shape unions, cookie forwarding, relevant headers and authenticated/unauthenticated evidence; missing metadata never means public.                                                                 |
| D04: AJV vs strict Newsletter validation | Preserve per-operation behavior; no uniform strict/strip/coerce default                                                        | #5/#6                                           | Input acceptance, parsed-output and unknown-key fixtures, plus generated input-view checks. Expand beyond the sampled cases before equivalence claims.                                                   |
| D05: dynamic Forms schema bypass         | Block stable Forms submission capability pending a security/compatibility disposition                                          | #6 Forms extraction and linked 3-tier follow-up | Record whether legacy acceptance is explicitly retained with documented constraints or changed by a separately reviewed/versioned migration; do not add validation silently.                             |
| D06: unreachable Forms submit default    | Preserve required submit formVersion; default only omitted definition-query version                                            | #6 Forms                                        | Missing submit version stays 400; omitted GET query version remains 1; coercion tested separately.                                                                                                       |
| D07: broad user schema / stale doubles   | Preserve the observed session envelope and JSON-compatible open user value; do not derive contracts from generator stubs       | #5 Auth                                         | Lossless RBAC wire fixture; review any narrowing of user data separately. Default schema and supported extension/profile boundaries need explicit documentation.                                         |
| D08: Forms delivery-secret forwarding    | Block stable Forms definition capability pending security review                                                               | #6 Forms extraction and linked 3-tier follow-up | Record access scope and a deliberate redaction/migration or explicit constrained legacy decision; synthetic evidence is not proof of production exposure. No automatic removal or acceptance in this PR. |
| D09: conditional routes always in spec   | Document capability/profile availability and generate only resolved enabled routes                                             | #6 Newsletter, #7                               | Enabled/disabled and wrong-method evidence; no deployment support claim from generator inclusion.                                                                                                        |
| D10: undeclared Forms pagination         | Preserve the array response and declared filters; do not add pagination                                                        | #6 Forms                                        | Record unknown query forwarding as legacy behavior. Any pagination/envelope redesign requires a separate version decision.                                                                               |
| D11: null-to-empty-string mutation       | Preserve this explicit request normalization for the legacy-compatible profile; keep omitted fields and response null distinct | #5 Identity                                     | Compare raw input, mapper-facing values and serialized output. Restoring literal null writes would be a deliberate semantic change requiring review/versioning.                                          |

The Forms blockers apply to the affected capabilities, not to writing extraction
code and tests. A prerelease may carry quarantined work with explicit unsupported
capability status, but must not bypass the security decision or advertise stable
conformance. The owning extraction PR must link any implementation follow-up it
opens and identify maintainers responsible for the release decision.

## Compatibility record required in #5/#6

For each operation/capability, record:

1. Package/version target, operationId, baseline revision and fixture IDs.
2. Input acceptance, parsed values and serialized success/error behavior, including
   headers and the resolved host/security profile.
3. Each applicable discrepancy, its disposition and the evidence that supports it.
4. Any intentional difference, why it is needed, its request/response/security
   impact, reviewed decision link, SemVer classification and downstream migration.
5. Remaining unsupported behavior and which publication/adoption claim is blocked.

The default for unclassified behavior is to investigate and retain the previous
claim/pin; it is not permission to silently relax validation or infer a missing
authorization rule. Use [release conventions](releases.md) for the version plan.

## Scope completion by epic issue

| Issue | Required result                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| #4    | Accepted ADR, package/export/module design, schema/type rules, operation protocol, SemVer/cross-domain rules and disposition ownership            |
| #5    | Auth/Identity schemas/operations and shared private authoring type; schema/type/packed-consumer evidence, policy boundary and domain dispositions |
| #6    | Forms/Newsletter schemas/operations and domain evidence; resolve or explicitly block the affected capabilities                                    |
| #7    | Executable operation validation, deterministic OpenAPI 3.1/profile manifests and compatibility/release-plan enforcement                           |
| #8    | Publication/provenance and independent conformance tooling, with actual support evidence; no adoption claim from package availability             |

3-tier adoption and DDD conformance remain the separate implementation work linked
by EPIC #1. DDD capabilities it does not implement stay explicitly unsupported.

## Issue #6 extraction evidence

Forms and Newsletter now have authored Zod packages and operation registries.
The [Forms compatibility record](../packages/forms/compatibility/README.md)
preserves D05/D08 as explicit stable capability blockers, exported through
`formsReleaseBlockers`. Contracts architecture maintainers and Bricks Forms/security
maintainers own their disposition, with downstream integration tracked in
[3-tier #489](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/489).
No security decision is bypassed by extraction or a pending Changeset.

The [Newsletter compatibility record](../packages/newsletter/compatibility/README.md)
documents D03/D04/D09, strict UTF-16 limits, honeypot precedence and signed webhook
semantics. Issue #7 must account for conversion gaps and resolve deployment
profiles; successful schema conversion alone does not establish equivalence.
