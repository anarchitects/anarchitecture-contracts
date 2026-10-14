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
checks ran locally on Node 24.21.0. Installed-package CI checks passed on both
Node 22.13.0 and 24.21.0 in run 38559390759.
Configured OpenAPI protocol tests prove deterministic JSON/YAML, separate JWT
constraints, exact configuration identity and rejection of stale projections or
host evidence. Their in-memory approval fixtures are test-only and are never
written to the accepted register or publication artifacts.
Default projected wire constraints also match the existing canonical artifact.
Separate configurable field nodes disclose additional occurrences of the same
audited password coercer in projection metadata; existing locations are retained
and no new limitation kind or function is introduced.

After [explicit human P07 approval](23-p07-approval.md) on 2026-10-14, generation
and byte verification pass for all 31 artifacts. `yarn check --output-style=static`
passes formatting, Markdown lint, baseline checks, all package builds/types/tests,
21 contract-authoring tests, 27 OpenAPI tests, 17 release-unit tests and packed
consumers. The remaining failure is the release smoke phase requiring a matching
reviewed compatibility migration. The original P07 failures are resolved; this
still is not a green release candidate.

The regenerated inventories for all four domains are identical to the PR base
outside `x-contract-projection` metadata. Runtime sources changed only for Auth.
The conservative checker nevertheless treats changed projection reviews and
manifest review digests as potentially breaking. It requires a minor release for
all four packages. Nx currently derives Auth `0.1.0` and Forms/Identity/Newsletter
`0.0.2`; those three patch versions do not satisfy that conservative gate. This
P07 update does not change version intent or silently approve migrations.

The [exact regenerated findings](23-compatibility.draft.json) and
[migration drafts](23-migrations.draft.json) are prepared against both the PR base
`3f5969da055c0799e49e1a9079f135816496c35b` and the immutable release commit
`1f8240b62b5533b136610ea44ebf16fe6b7efae4`. Their findings digests are:

| Package    | Findings SHA-256                                                   |
| ---------- | ------------------------------------------------------------------ |
| Auth       | `c8f2d62dabd556913908685b93cf9d24bdb248bf023345e2a39cacee9d2e6992` |
| Forms      | `d10dfa5b962cf1e331f1cebfaecff53eff6e80e2f17d14878417b7101fc3381e` |
| Identity   | `0aadd277d82a0983b9c53f6fd499bb08344c45b873edc2143bcc82c330a19e35` |
| Newsletter | `30e6f53dba839e5c01b03bb32a524b789d69daf8c667ed5a73856786a8f7edec` |

P07 approval does not authorize these separate migration records. No active
migration record, release rule, classifier or package version is changed.

## Required review and release sequence

1. The exact default-source/generator [P07 candidates](23-projections.draft.json)
   were explicitly approved and applied. The 31 entries cover all four domains
   because generator identity is shared; only Auth canonical source changed. Configured hosts
   additionally generate and review candidates for their complete configuration.
   Package OpenAPI files were regenerated from canonical sources after approval;
   none were manually edited or generated under synthetic approval.
2. Review the exact regenerated compatibility findings and migration drafts for
   the PR base and each last-release tag. Resolve the conservative minor-version
   requirement for all four domains explicitly. The existing active migration
   format accepts one exact base per package: apply PR-base records for PR CI,
   then the separately reviewed last-release records during release preparation.
   Do not reuse a stale base or findings digest.
3. Run the full `yarn check`, installed-package and compatibility gates. A
   `feat(auth-contracts)` release intent derives `0.1.0` after `0.0.1` in Nx's
   preview. Shared generator changes also refresh other
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
