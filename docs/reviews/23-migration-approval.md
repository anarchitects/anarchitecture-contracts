# Issue #23 migration and version-intent approval

On 2026-10-14, Johan Vrolix explicitly approved the prepared migration records
for both baselines, the `0.1.0` version intent for Auth, Forms, Identity and
Newsletter, and commit/push to PR #24. The exact chat response was:

> Ja, keur migraties, versie-intentie en commit/push goed

This records the chat authorization; it is not a GitHub review or approval to
merge or publish. P07 approval is recorded separately in [the P07 record](23-p07-approval.md).

## Exact reviewed inputs

- Prepared revision: `b592c4d47e78c914825abac7e080f9ed31739314`.
- Historical draft: [23-migrations.draft.json](23-migrations.draft.json).
- Draft SHA-256: `278b9451f1dac19a122aa04bb58f13934422e9f84f770d933470f2a99e18bda0`.
- PR baseline: `3f5969da055c0799e49e1a9079f135816496c35b`.
- Published `0.0.1` baseline for all four packages:
  `1f8240b62b5533b136610ea44ebf16fe6b7efae4`.
- Findings: [23-compatibility.draft.json](23-compatibility.draft.json), with
  per-package digests listed in [the audit](23-configurable-auth.md).

Both sets of four records are activated in `tools/openapi/migrations/`, changing
only draft status and owner/approval provenance. The historical earlier approval
is retained. The prepared draft remains unchanged as evidence.

## Architecture and tooling scope

The recorded ADR preflight still applies. Local ADR-0004 and Meta ADR-0013 keep
Nx Conventional Commits as the sole version authority. The compatibility and
release guides require exact baseline/findings approval for both PR deltas and
cumulative release deltas. Supporting multiple exact records reconciles those
requirements without changing the classifier, P07 generator identity,
canonical sources or generated artifacts.

Previously a migration file could hold only one record, although release smoke
already checked the last release and PR CI separately checked the PR base. The
backward-compatible array format lets both explicit approvals coexist. Exactly
one record must match package, base revision and findings digest, and it must be
approved and complete. Tests reject stale, missing, draft and duplicate matches,
changed findings and insufficient version bumps.

The user subsequently requested zero-major alignment in this same PR:

> Neem de afstemming nu mee in PR #24

The scope review rechecked all five local ADRs and the applicable Meta ADR-0013,
plus release/compatibility guides. No accepted ADR requires `false`. Current
Bricks 3-tier, Community and Plugins use Nx 23 with its default `true`; Contracts'
explicit override originated in historical Changesets transfer equivalence.

The configuration now explicitly uses `true`. Compatible additions require patch
before 1.0 and minor afterward. Breaking findings still require minor before 1.0
and major afterward, plus matching approval. Real Nx/Git fixtures cover both
commit-header and footer break notation, feature and fix bumps, initial `0.0.1`,
and rejection of an insufficient actual Nx bump even with migration approval.

For this PR, the approved findings still conservatively classify changed published
projection/source provenance as breaking. Old source/generator-bound review
records cannot approve the new artifacts; consumers must regenerate and review
their exact configured evidence. The repository-wide commit explicitly discloses
that artifact/review incompatibility using breaking notation, rather than claiming
a default HTTP wire break. With `true`, Nx derives the approved `0.1.0` line for
each affected package. No classifier override or forced specifier is introduced.
Package manifests stay at the published version until the CI-owned release.
No supported default wire change is intended and no deprecation is proposed.
Publication, host conformance and Bricks adoption remain separate work.
