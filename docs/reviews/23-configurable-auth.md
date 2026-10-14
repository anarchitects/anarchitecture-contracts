# Configurable Auth contracts — issue #23

This change adds a canonical factory for the Auth field rules used jointly by
Bricks Nest and Angular. It unblocks the schema ownership seam in
[Bricks #488](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/488)
after review, publication and downstream integration. It does not implement
Nest/Angular adapters or claim host conformance.

## Architecture preflight

All five local ADRs were read at `3f5969da055c0799e49e1a9079f135816496c35b`;
`adr/` is the only documented local ADR directory. All 16 Meta ADRs were read at
`a66c525132cab0e59d12d55a92bb0d1830953f8e`, including proposals and historical
records; the upstream revision was verified. All 20 Bricks ADRs were read at
`879eec0e83f7a7125641c0ae44598be0dffa6bd1` for the originating consumer audit.

Applicable accepted decisions: Meta ADR-0012 gives Contracts canonical wire
ownership; Meta ADR-0013 and local ADR-0004 require independent immutable
versioning through Nx Conventional Commits. Local ADR-0005 separates publication
from host conformance. The reviewed package/schema/operation/baseline/generation
and release guides preserve coercion, parsed meaning and security obligations.
Meta HTTP-adapter proposals do not change shipped Fastify or Nest defaults.
No Nest 12-native auth or authorization changes are included.

The principal conflict is the temptation to use fixed `0.0.1` schemas for every
host or reauthor custom Zod schemas in Bricks. Both would violate existing
configuration behavior or canonical ownership. The canonical factory resolves
that conflict. P07's exact source/generator approvals must be reassessed; this
branch deliberately does not renew them automatically.

## Compatibility evidence

The existing named default schemas now derive from the canonical factory.
Configured outputs bind seven session request schemas into the canonical operation
registry; all responses, paths, status codes, security, cookie semantics and
non-session operations stay unchanged. JWT login retains default rules and gets a
separate catalog identity only within configured output.

The frozen oracle is the original Bricks factory/config at
`ecda1b6e0d9bc39c66373452a92dce91e06abee0`, verified by SHA-256 before use. The
new differential suite compares 4,536 field cases using the pinned Fastify AJV
configuration, asserting acceptance and normalized values. It covers required and
optional fields, strict and relaxed bounds, Unicode, email, scalar/singleton
coercion, decoded overflow, unknown fields and all three shaping policies.
Existing frozen request/response tests remain unchanged.

The regression examples now agree with Bricks: password minimum 10 rejects
`12345678`; minimum 3 accepts `1234`. `emptyStringPolicy` remains metadata, not a
server-side transformation. The configuration is parsed, detached and frozen;
invalid configurations fail early. No supported valid-profile wire break is
intended. The conservative source-change compatibility gate still requires an
exact reviewed migration record before release; differential evidence does not
waive that review. No npm deprecation of `0.0.1` is proposed.

Clean packed consumers verify ESM/CommonJS, TypeScript 5.5.4/6.0.3 in NodeNext and
bundler modes, optional/required field inference and browser bundling. Runtime
checks ran on Node 24.21.0; Node 22 remains a CI verification obligation.
Configured OpenAPI protocol tests prove deterministic JSON/YAML, separate JWT
constraints, exact configuration identity and rejection of stale projections or
host evidence. Their in-memory approval fixtures are test-only and are never
written to the accepted register or publication artifacts.
Default projected wire constraints also match the existing canonical artifact.
Separate configurable field nodes disclose additional occurrences of the same
audited password coercer in projection metadata; existing locations are retained
and no new limitation kind or function is introduced.

Validation on 2026-10-14 (`yarn check --output-style=static`): formatting, Markdown
lint, baseline checks, all package builds/types/tests, 21 contract-authoring tests
and packed consumers pass. The three new OpenAPI tests pass. The full
command fails at `openapi`, `openapi-test` (nine failures) and `release-test`
(two failures), all on unchanged P07 approvals rejecting the new Auth source
bytes. This is a draft awaiting review, not a green release candidate. The release
smoke phase is not reached after its prerequisite tests fail.

## Required review and release sequence

1. Review the exact default-source/generator [P07 draft candidates](23-projections.draft.json).
   The 31 entries cover all four domains because generator identity is shared;
   only Auth canonical source changed. Configured hosts
   additionally generate and review candidates for their complete configuration.
   The accepted register remains unchanged; its old pins correctly reject this
   branch. No package OpenAPI files have been manually edited or regenerated under
   synthetic approval.
2. Renew scoped approvals only after human review, regenerate canonical artifacts,
   and review the resulting exact compatibility findings against both the PR base
   and `auth-contracts@0.0.1`. The [preliminary findings](23-compatibility.draft.json)
   are source-only drafts until artifacts can be regenerated. Prepare matching migration approvals; if these bases
   differ, reassess the cumulative release findings rather than reusing a stale pin.
3. Run the full `yarn check`, installed-package and compatibility gates. A
   `feat(auth-contracts)` release intent targets `0.1.0` after `0.0.1`, subject to
   Nx's actual preview and review. Shared generator changes also refresh other
   domains' artifact identities; assess any resulting published-artifact bumps
   independently. Do not force another domain's version or overwrite `0.0.1`.
4. After human acceptance and merge, run the signed CI release and trusted publish
   workflows under ADR-0004/Meta ADR-0013. Record the actual new version, immutable
   tag/commit, registry integrity and clean-install evidence.
5. Bricks #488 pins that published version, derives TypeBox compatibility adapters,
   integrates Nest validation plus Angular metadata/shaping, and proves existing
   HTTP/errors/cookies/JWT/passkeys/policy and Identity behavior. Full adoption
   remains blocked until those tests pass. Default Auth and Identity preparation
   may proceed independently, but are not implemented by this upstream change.
