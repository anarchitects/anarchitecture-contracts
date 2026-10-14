# P07: reviewed, scoped projection register

The [issue #7 decision](https://github.com/anarchitects/anarchitecture-contracts/issues/7#issuecomment-6146764328)
accepts faithful conversion by default and narrowly scoped exceptions where
portable OpenAPI cannot fully describe the existing parser. This replaces the
initial blanket proposal. It does not approve a deployment, security bypass or
wire-language change. Canonical Zod validation remains mandatory.

[projection-proposal.json](../tools/openapi/projection-proposal.json) retains its
historical filename but is now the reviewed register. Each entry names exactly
one domain, operation, component and input/output view, its owner and decision,
source and generator SHA-256 digests, constraint/function locations, rationale
and executable evidence. Both diagnostic and release generation enforce these
entries on **every use**, including cached components. Missing, stale or altered
records fail closed. `review-candidates.mjs` emits drafts for review only; ordinary
generation never updates approvals or pins.

## Faithful UTF-16 length

Newsletter's canonical check counts UTF-16 units; JSON Schema `maxLength` counts
Unicode code points. That difference is representable without changing inputs.
If a string has `n` code points and `k` supplementary characters, its UTF-16 length
is `n + k`. In addition to the canonical `maxLength: M`, the converter emits, for
each `k` from 1 through `floor(M / 2) + 1`, a Unicode-regex condition: if at least
`k` supplementary characters occur, require `maxLength: M - k`. These conditions
are necessary and sufficient. BMP characters, line breaks and lone surrogates
cost one unit; supplementary characters cost two. A zero bound needs no extra
condition. The implementation bounds the audited conversion at 2048 units.

This requires a conforming JSON Schema 2020-12 evaluator with Unicode regular
expressions. The pinned AJV tests exercise both sides of each boundary, mixed
strings and the honeypot branch. A native token of 65 emoji now fails both the
projection and Zod. UTF-16 length is **not** an exception.

## Representable constraints retained

Known scalar-to-string pipelines retain output constraints for raw strings and
singleton strings, and exactly exclude invalid boolean/null inputs and singleton
wrappers. For example, both parsers now reject a one-character login password.
The converter recognizes the audited function and each operation's exact source
bytes; it does not guess behavior for arbitrary transforms.

Newsletter webhook conversion retains nonblank event names, conditional
subscriber identifiers/email, timestamp grammar and nullish fallback order, and
batch discrimination. Leaf constraints come from canonical Zod schemas. Invalid
withdrawal data and invalid batches cannot fall through to an unhandled event.
Arbitrary event/type equality and exact JavaScript timestamp parseability remain
outside this portable projection.

## Remaining exceptions and consumer impact

| Constraint                                    | Scope recorded per operation/component                                            | Remaining obligation                                                                                                                                                                                                                                                            |
| --------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Decoded exponent overflow                     | Auth, Forms and Identity coercion; decoded open JSON extras, including Newsletter | `JSON.parse('1e309')` produces JavaScript infinity. The projection uses the existing finite-number sibling, never `{}`. Canonical decoding/normalization can accept values the projection rejects.                                                                              |
| Normalization and post-conversion constraints | Auth/Identity/Forms scalar, integer, array and nullable pipelines                 | JSON Schema is a predicate, not a JavaScript transformation. Numeric stringification, `Number` parsing, parsed output and constraints on transformed values still require Zod. A numeric password of `1` is a disclosed overacceptance; `123456` becomes the string `"123456"`. |
| Runtime/cross-field refinements               | Newsletter webhook                                                                | Portable JSON Schema has no general equality comparison between arbitrary sibling values and does not implement JavaScript `Date.parse`. Conflicting unhandled event aliases and an impossible month are executable negative counterexamples.                                   |

These exceptions can overaccept **or underaccept** decoded values. OpenAPI-only
validators and generated clients cannot replace canonical validation. Every
affected component carries `x-contract-projection` with reviewed scope,
limitations and this warning; manifests include the review records and register
digest. Faithful conversions have separate review records. No arbitrary custom
schema, omitted constraint or new operation acquires an exception implicitly.

The proof suite is [fidelity.test.mjs](../tools/openapi/fidelity.test.mjs), alongside
[openapi.test.mjs](../tools/openapi/openapi.test.mjs), the canonical differential
tests, supplemental webhook probes and frozen HTTP fixtures. Request acceptance,
parsed output and serialized responses are separate assertions. No frozen
baseline or canonical legacy parser is changed to make conversion pass.

Reassess entries whenever canonical source, generator, pinned Zod, validation
consumers or profile behavior changes, and before publication. A newly proven
faithful conversion replaces the relevant exception; a wire-language change needs
its own reviewed migration and release intent.

## Security and completion boundary

P07 cannot approve anonymous protection, missing HMAC, unchecked dynamic Forms
fields or delivery-secret exposure. Profiles independently require exact-version
host configuration and reviewed positive/negative HTTP evidence. Synthetic
profiles exercise those gates and remain `test-only`, with no supported capability
claim. Current checked-in artifacts remain `review-only` because real host
bindings are unresolved.

Issue #7 is complete when this generator and its fail-closed gates are implemented
and tested. Actual host evidence belongs to the relevant Bricks capabilities;
Forms remediation belongs to [3-tier #489](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/489).
[Contracts #8](https://github.com/anarchitects/anarchitecture-contracts/issues/8)
owns packaging/publication, not creation of deployment evidence. Neither issue
must finish before #7 can close. Outstanding blockers stay in generated manifests.

All 15 Meta ADRs were reviewed at
`e2f34553c6e2492d0ab6f80ac795de44fc592a70`, matching upstream, and all three local
ADRs at `401d8e4` (unchanged since the prior review). Accepted ownership, platform
independence and compatibility requirements apply; proposed governance remains
contextual. ADR-0003 assigns the Nx Release cutover to #8. The Changesets input
adapter is now replaced by Nx Conventional Commit version previews under
[ADR-0004](../adr/0004-package-initial-release-and-nx-versioning.md).
