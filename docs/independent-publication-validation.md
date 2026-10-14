# Independent publication validation (#20)

Scope: [ADR-0005](../adr/0005-independent-contract-publication-and-implementation-conformance.md).
Base: Contracts `0ab1566859bbb971416a5168dbb0ef54745f5c8f`; Meta ADR review:
`a66c525132cab0e59d12d55a92bb0d1830953f8e`. All four previous local and sixteen
Meta ADRs were read; ADR-0004 is unchanged. The implementation changes artifact
presentation and publication gating, not canonical runtime/wire semantics.

## Regression evidence

| Requested case                                    | Executable evidence                                                                                                                                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A/B: no host or supported capabilities required   | `tools/openapi/artifacts.test.mjs` generates each domain; `tools/release/history.test.mjs` passes each real packaged manifest through Gate A with empty support                                                           |
| C: protection never becomes anonymous             | Canonical tests compare every operation's authored security with the document obligations and exclusions; original registry/profile AND/OR/HMAC tests remain                                                              |
| D/E: synthetic evidence and Forms blockers        | Canonical host-wrapper tests plus `profiles.test.mjs` reject relabeled synthetic evidence, missing/changed security cases and D05/D08                                                                                     |
| F/G: invalid definitions and P07                  | Canonical tests reject unknown security, unregistered Zod schema and missing/stale approvals; original fidelity/registry tests exercise dangling OpenAPI references and executable projection counterexamples             |
| H/I: version preparation and package independence | Real Nx fixture versions only Auth to `0.0.1`, generates, rebuilds and verifies identical canonical bytes; an invalid Forms manifest fails Forms while Auth passes                                                        |
| J: clean neutral consumers                        | Existing packed suite checks all public exports, ESM/CommonJS, runtime boundaries, TypeScript 5.5/6 NodeNext/bundler modes and browser bundles; now checks canonical manifest states and every artifact digest            |
| K/L/M/N: version authority and compatibility      | Real Nx/Git Conventional Commit fixtures cover init, explicit initial `0.0.1`, subsequent patch/minor/breaking and zero-major bumps; insufficient versions and missing migrations fail                                    |
| O: no second versioner                            | Nx configuration regression plus historical archive checks; Nx config, complete type mapping, ADR-0004 and historical plans remain unchanged                                                                              |
| P: immutable version and release metadata         | Versioned generation fixture checks package/OpenAPI/manifest equality and rejects a mismatched release-tag version; existing workflow tests execute signed-tag/commit resolution and reject unsigned/draft/invalid inputs |

## Local checks

Node 24.21.0 / Yarn 4.18.1:

- Immutable Yarn installation and Nx project/graph inspection passed.
- `yarn format` and full `yarn check` passed: the 22-task graph covers build,
  typechecking, schema/behavior/baseline tests, 31 deterministic generated files,
  OpenAPI/P07/profile tests, packed consumers and release tests/dry runs.
- `yarn openapi:compatibility origin/main` passed with exact-base, findings-pinned
  migration records for the manifest format change and additive exports. Previous
  migration records are archived byte-for-byte in `release-history/compatibility-before-0005/`.
- `yarn release:dry-run --projects auth-contracts --first-release` passed;
  Nx proposes exactly `0.0.1`. No tag, release or npm publication is performed.
- Read-only GitHub/npm history verification found no distributions for any of
  the four packages. Their manifests remain `0.0.0` in this PR.

The isolated real-versioning test writes temporary fixture files only. It invokes
Nx's version API with Git actions disabled, never the live release workflow.
Existing P07 register entries, pinned projection engine files, runtime sources,
frozen baseline and archived plans are unchanged. No approvals were regenerated.

## Limits and external prerequisites

Local consumer execution uses Node 24; Node 22/24 also run in the PR CI matrix.
Record the PR checks separately; local success does not predict remote results.
No live release, npm publish, provenance issuance or deployed HTTP test was run.
Signatures are exercised with workflow fixtures, not a live release operation.

Maintainers still need to verify the release signing identity, GitHub App access,
unchanged branch permissions, npm package onboarding/trusted-publisher mapping
and the first real publication/clean-registry-install evidence. The Bricks work
in #488, #489, #490 and DDD #23 owns real HTTP conformance, support matrices and deployment
attestations. Forms D05/D08 remain blocked for affected host claims. These host
tasks do not block independent canonical contract publication.
