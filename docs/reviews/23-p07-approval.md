# P07 approval for configurable Auth contracts

On 2026-10-14, the user explicitly approved the 31 projection records proposed
for PR #24 at commit `9e564329318e67143a87d21fd1bef36b4fff2096` in the implementation
conversation. The confirmation was: “ik keur ze expliciet foed”. This is a record
of that conversation approval, not a claim that a GitHub review was submitted.

The approved input is [23-projections.draft.json](23-projections.draft.json)
at that immutable commit. Its file SHA-256 is
`647f64047ed51fcf7c8aff700fbdb9ed2c98605aabf358a87448f887ba98cfe2`.
Its historical draft status is preserved. The active register promotes those
exact entries to reviewed and adds this approval record to their evidence.
The P07 framework decision remains the original issue #7 decision; this approval
renews the exact source/generator pins under that framework.

## Scope and evidence

- All 31 records have updated generator hashes; 16 Auth records have updated
  source hashes. All existing record IDs are retained.
- Register, reset-password and change-password records disclose eight additional
  graph locations for the same already audited password coercion functions.
  No existing limitation is removed and no new limitation kind/function is added.
- 4,536 configurable-field comparisons, the existing compatibility suites and
  the three new OpenAPI tests pass. Default projected wire constraints match
  the prior artifact. Installed-package checks pass on Node 22.13.0 and 24.21.0
  in [CI run 38559390759](https://github.com/anarchitects/anarchitecture-contracts/actions/runs/38559390759).
  That run's failures are the old register rejecting these source bytes.
- All five local and 16 Meta ADRs were already reviewed for this scope. Upstream
  remains at `3f5969da055c0799e49e1a9079f135816496c35b` and Meta at
  `a66c525132cab0e59d12d55a92bb0d1830953f8e`; both were rechecked before applying
  approval. Canonical ownership, independent versions and host-conformance gates
  remain unchanged.

The user also authorized the corresponding metadata update, artifact regeneration,
commit and push to PR #24. This approval does not approve a compatibility migration,
merge, publication or host deployment. Configured hosts still require their own
exact-configuration projection reviews and runtime evidence. Any subsequent
source/generator change must pass the existing pin checks and review rules.
