# ADR-0005: Independent Contract Publication and Implementation Conformance

- Status: Accepted
- Date: 2026-10-14
- Owners: Architecture maintainers
- Implements: [Contracts #20](https://github.com/anarchitects/anarchitecture-contracts/issues/20), under [EPIC #1](https://github.com/anarchitects/anarchitecture-contracts/issues/1)
- Governing: Meta ADR-0012 and ADR-0013; Contracts ADR-0004 remains Accepted and unchanged.
- Refines: ADR-0002 decision 8 and ADR-0003 contract/conformance release guidance.
- Partial supersession: host-resolved evidence as a prerequisite for canonical package publication in the #7/#8 guidance. Host-support and deployment gates remain mandatory for their respective claims.

## Review and conflict

Read all four local ADRs at `0ab1566859bbb971416a5168dbb0ef54745f5c8f` and all
sixteen Meta ADRs at `a66c525132cab0e59d12d55a92bb0d1830953f8e`, including
Accepted, Proposed and historical records; both matched upstream on 2026-10-14.
`adr/` is the only documented local ADR directory; ADR-0005 was available.
Reviewed AGENTS, package/schema/operation/release guides, baseline dispositions,
P07, migration records, EPIC #1, issues #7/#8, PRs #16/#17, the Nx graph,
workflows, generator, compatibility and conformance tests.

Meta ADR-0012 owns the downstream dependency direction and permits independent
capability adoption. Meta ADR-0013 / local ADR-0004 own versioning. The accepted
HTTP independence, neutral-package, safe migration and auth-ts semantic boundaries
continue to apply. Cooperative-enrichment and governance hierarchy/Archi/workspace
proposals remain context; none overrides accepted decisions.

The old publication gate required a resolved host and supported capabilities,
while Bricks migration required published contracts. ADR-0002's resolved-only
artifact wording and #7/#8 publication guidance therefore need this explicit
refinement. This implements Meta's existing ownership direction; it changes no
ecosystem repository ownership and requires no Meta supersession.

## Three responsibilities

1. **Contract validity — Contracts.** Own canonical Zod schemas, complete HTTP
   operation definitions, deterministic OpenAPI 3.1, explicit security obligations,
   narrowly reviewed P07 exceptions, compatibility/migrations, exports/declarations,
   packed consumers, independent versions, integrity/provenance and known limitations.
   A running implementation is not a prerequisite for publication.
2. **Implementation conformance — implementing repository.** Consume an exact
   published version; prove supported routes, positive/negative HTTP behavior,
   authentication, authorization, errors, headers, cookies and security semantics.
   Publish an evidence-backed capability matrix. A package's existence proves none
   of these claims. Both Bricks implementation styles retain equal standing.
3. **Deployment compliance — host.** Resolve concrete security/configuration and
   enabled capabilities against exact implementation/contract versions, immutable
   runtime reports and maintainer approval. Synthetic evidence cannot authorize
   deployment. Approval digests bind evidence; maintainers verify its provenance.

The dependency direction is Contracts → Implementations → Verified Deployments.
Implementation or deployment approval is never a canonical publication prerequisite.

## Artifacts and gates

Canonical artifacts derive from the same Zod/operation graph and the existing
reviewed projection engine. Package generation always produces canonical artifacts,
including after Nx changes versions. Keep the existing review JSON/YAML exports
as diagnostic artifacts; add explicit canonical exports. No handwritten spec,
invented credential transport or host dependency is introduced.

Canonical OpenAPI is explicitly nondeployable. Its inventory contains every
operation and normative security/behavior obligation; protected operations lacking
concrete bindings stay excluded from OpenAPI paths, with explicit reasons and
security obligations. Only authored public operations may emit `security: []`.
The canonical document is not a complete client-generation/deployment profile.
Hosts produce a separate resolved document to document their verified subset.

Manifest format 2 separates `contractPublication`, `implementationConformance`
and `deploymentCompliance`, with an explicit artifact kind. Canonical validity
does not imply support: `supportedCapabilities` stays empty, host provenance is
absent, and blockers/unresolved bindings remain disclosed. Existing review-only
and test-only artifacts are not canonical publication candidates. Host artifacts
record their evidence-backed states without becoming package publication inputs.

Gate A re-generates and compares canonical artifacts from current sources, checks
versions, exports and integrity, and runs through the existing build/type/schema,
P07, compatibility/migration and packed-consumer checks. Live release/publish
retain immutable history, verified signatures, trusted npm/OIDC and provenance.
Gate B keeps strict resolved-profile, real HTTP/security evidence, exact identity,
approval and capability restrictions. A host must reference distributed contract
versions; offline checks do not authenticate reports or prove registry existence.

P07's scope, source/generator pins and executable counterexamples are preserved.
The canonical presentation layer does not change projection semantics or refresh
approvals. Its own bytes are included in artifact generator identity. Stale or
unreviewed projections still fail canonical and host generation.

D05 dynamic validation and D08 secret-free public definition responses remain
mandatory implementation requirements. Retained legacy Forms DTOs/operations are
explicit compatibility evidence, not approved secure implementation behavior.
Existing safe DTO targets and migration requirements remain; switching routes or
removing blockers requires separately reviewed versioned migration and real host
evidence. These host blockers do not prevent publishing canonical definitions,
nor make unrelated packages depend on Forms remediation.

## Release conventions and consequences

ADR-0004 is not superseded: Node 24, Yarn 4, Nx/@nx/js, independent versions,
Conventional Commits as the sole bump authority, non-bumping `init` with exact Nx
scopes before distribution, and first official distribution exactly `0.0.1`
remain unchanged. No Changesets/version plans are introduced or consumed.
Actual Nx versions must satisfy compatibility and pinned migration checks.
Historical release records remain immutable.

Version preparation generates and verifies canonical artifacts before signed
commit/tag creation; publication rebuilds/verifies from the immutable tag. The
manual GitHub release and npm publish workflows remain separate. Packages and
independent conformance tools never acquire Nx/framework/Bricks runtime dependencies.

This decision authorizes the gate correction, not a release or host approval.
Bricks #488/#489/#490 and DDD #23 own implementation evidence; Contracts owns
publication mechanics and contract validity. External signing, branch permissions,
npm trust setup and first real publication evidence remain separate prerequisites.
