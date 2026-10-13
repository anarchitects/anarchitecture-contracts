# ADR-0002: Domain contract authoring and publishing boundaries

- Status: Accepted
- Date: 2026-10-13
- Owners: Architecture maintainers
- Scope: Public HTTP contract package design; implementation follows in #5–#8
- Implements: [issue #4](https://github.com/anarchitects/anarchitecture-contracts/issues/4), under [EPIC #1](https://github.com/anarchitects/anarchitecture-contracts/issues/1)
- Refines: [ADR-0001](0001-contract-workspace-and-release-foundations.md)
- Release-tooling override: [ADR-0003](0003-nx-workspace-and-release-governance.md) supersedes Changesets-specific versioning; package boundaries and wire compatibility rules remain Accepted.

## Context and reviewed evidence

The [frozen legacy baseline](../baselines/legacy-3tier/README.md) inventories 29
operations, 26 generated operationIds and 123 HTTP scenarios. Its TypeBox values,
controller metadata and generated OpenAPI are migration evidence, not the new
authoring source. Differences in coercion, unknown keys, error bodies, cookies
and host security mean that copying schemas alone would not preserve behavior.

All 15 Meta ADRs were reviewed at
`e2f34553c6e2492d0ab6f80ac795de44fc592a70`; upstream `main` matched that revision.
All local ADRs (ADR-0001 before this addition), package/release conventions and the
merged #3 baseline were reviewed at Contracts revision
`76815343bbc94d9e1f98ef6d1006740f34c18d82`. Relevant Meta guidance on neutral
package boundaries was also reviewed. The baseline pins the audited 3-tier
implementation to `ecda1b6e0d9bc39c66373452a92dce91e06abee0`.

Applicable accepted Meta decisions are ADR-0001 (both implementation styles),
ADR-0004 (landscape ownership), both ADR-0008 records (HTTP independence and
neutral TypeScript boundaries), ADR-0010 (Zod direction and Nest 11 patch-only),
ADR-0011 (safe schema/policy migration), and ADR-0012 (Contracts ownership).
The cooperative-enrichment and ADR-0005/0006/0007 proposals remain contextual;
they do not introduce requirements here. ADR-0009 approves evaluation, not a new
HTTP adapter default. No conflicting accepted decision was found. This decision
does not replace providers or implement Nest 12 modernization.

## Decision

1. Establish four independently versioned packages:
   `@anarchitects/auth-contracts`, `@anarchitects/forms-contracts`,
   `@anarchitects/identity-contracts` and `@anarchitects/newsletter-contracts`.
   Their workspaces are `packages/auth`, `packages/forms`, `packages/identity`
   and `packages/newsletter`. Each owns its public transport schemas, inferred
   types, operation definitions and generated domain artifacts. Auth session,
   JWT and passkey capabilities share one package version with explicit subpaths;
   Newsletter native actions and webhook likewise share its domain version.
2. Author canonical schemas in **Zod 4** and operation definitions in TypeScript.
   Infer request input, parsed request and serialized response types from those
   schema values. Declare Zod as a normal package dependency, pinned to the exact
   tested version when extraction begins. Do not bundle a private Zod copy or
   depend on a consumer's hoisted installation. No Zod dependency is installed by
   this design-only change.
3. Define operations as typed, declarative values referencing the actual schema
   objects. Include method/path, stable operationId, tags, parameters, request
   body, responses by status, errors, headers, security, availability and semantic
   evidence. Use the [operation protocol](../docs/operation-definitions.md).
   Share its authoring type in repository-only tooling; published declarations
   must be self-contained. Do not add a common domain model or an extra public
   utility package before a concrete shared runtime need exists.
4. Make omission, nullability, stripping/rejection/preservation, transport
   coercion, defaults, formats and serialization explicit under the
   [schema conventions](../docs/schema-authoring.md). Permit only deterministic,
   tested transport normalization in request schema pipelines. Use their input
   view for request documentation and output view for responses. Business rules,
   storage lookups, clocks, cryptography and provider calls remain outside schemas.
   Reject unrepresentable schema conversions; never weaken them to `{}` to make
   generation succeed.
5. Keep domain packages independent of one another initially. Identity's
   authUserId is an opaque wire string, not an import of Auth's user model. Forms
   and Newsletter do not import Auth because a host guards their routes. Future
   shared wire values must use the owning package's explicit public export with
   a reviewed acyclic dependency and SemVer impact. Domain errors stay with their
   operations; similar shapes do not justify a universal error envelope.
6. Exclude DDD entities, aggregates, domain invariants, application ports,
   repositories, orchestration, provider engines and runtime business logic.
   `auth-ts` retains policy semantics and evaluation/conformance ownership. Auth
   contracts owns only policy JSON on HTTP; consumer-owned mapping must preserve
   ordered rules, conditions, fields, denials and reasons without lossy translation.
   Contracts does not import or fork the evaluator or semantic model.
7. Build ESM and CommonJS artifacts from the same source with explicit exports
   and format-appropriate declarations. Avoid Node/browser globals, framework
   dependencies and import-time mutable registries. These are packaging targets,
   not tested support claims in this PR. Extraction must prove both formats and
   browser consumption using packed artifacts before publication; see
   [package conventions](../packages/README.md).
8. Generate OpenAPI **3.1** JSON/YAML deterministically in #7 from the schema graph
   and operation registry. A document describes a resolved capability/security
   profile and exact package versions. Aggregate documents record a package
   version manifest; they do not create a shared domain release version. Neither
   JSON Schema nor OpenAPI is separately authored. Runtime bindings and any
   temporary TypeBox/Fastify adapters belong to implementation consumers.
9. Preserve the 26 audited operationIds. Assign the three missing JWT IDs
   `loginWithJwt`, `logoutWithJwt` and `refreshJwtTokens` when #5 authors their
   operations. This fills documentation gaps without changing endpoints. Do not
   recreate the obsolete refresh-tokens route. Apply the
   [baseline disposition register](../docs/baseline-dispositions.md) to the other
   findings; this ADR does not authorize a wire break or approve the recorded
   Forms security defects as a stable contract.
10. Version each domain independently using **Nx Release after the controlled issue #8 cutover** (Changesets remains a transitional source of pending release intent) and the
    [release rules](../docs/releases.md). Treat package exports/types, schema
    parsing and HTTP behavior as compatibility surfaces. Evaluate requests and
    responses in both directions, including negative/security behavior. Changes
    to dependency ranges and generation may require consumer package bumps.
    Package publication and verified implementation adoption remain separate gates.

## Delivery and consequences

Issue #4 delivers this Accepted design and its linked conventions. It creates no
placeholder package, publishes nothing and leaves the frozen baseline untouched.
Issue #5 implements Auth/Identity schema/operation exports and package tests;
issue #6 implements Forms/Newsletter. This corrects the initial design guides
that assigned Identity to #6; issue #5 explicitly owns both Auth and Identity.
Issue #7 implements generation, operation validation and semantic compatibility
gates; #8 implements publication and independent conformance tooling. Each stays a
separate reviewed PR. Existing Nest 11 maintenance commitments remain intact.

Four domain release lines avoid coupling unrelated changes. A shared private
authoring protocol prevents operation-shape drift without adding a runtime
dependency. Dual module output adds build and packed-consumer verification work;
it avoids making contract adoption depend on a host module-format migration.
Conditional security, non-schema behavior and legacy discrepancies require
explicit evidence rather than a schema-only compatibility claim.

## Alternatives

- A monolithic package or fixed version group would couple domain releases.
- A generic common package would couple unrelated IDs, errors and business models.
- ESM-only output would impose a module transition on CommonJS consumers; select
  dual output and verify it rather than assuming interoperability.
- TypeBox-first extraction or independently maintained OpenAPI would create a
  second authoring authority contrary to Meta ADR-0012.
- Uniform strict objects, coercion or error envelopes would change the baseline.
- Framework operation decorators would put canonical metadata back inside an
  implementation and prevent independent consumption.
