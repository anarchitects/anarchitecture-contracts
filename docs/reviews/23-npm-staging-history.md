# Issue #23 npm staging history correction

CI run [38565439035](https://github.com/anarchitects/anarchitecture-contracts/actions/runs/38565439035)
passed workspace checks and packed consumers on Node 22/24, then rejected npm
`0.0.0-stage` as a distribution without a matching Git tag. Local checks had not
run the remote history path enabled by `GITHUB_ACTIONS=true` in commit validation.

## Evidence and origin

[npm staged publishing documentation](https://docs.npmjs.com/staged-publishing/)
explains that staging a brand-new package automatically creates a publicly visible
`0.0.0-stage` placeholder; the submitted package becomes public only after approval.
The [npm Registry API](https://api-docs.npmjs.com/) also documents the standardized
placeholder created by the staging endpoint. This is registry bookkeeping, not
an implementation prerelease or a contract version to reconstruct with a Git tag.

On 2026-10-14, all four registry packuments and tarballs were inspected. Each
placeholder has `stub: true` and contains only `package.json` and a holding README,
with no runtime code. Downloaded tarball SHA-512 values match registry integrity.
The exact package/version/integrity/URL and original registry timestamps are
recorded in [the evidence file](../../tools/release/npm-staging-placeholders.json).
The placeholders appeared at 12:33–12:34 CEST, shortly before the real `0.0.1`
packages. Each package's current npm `latest` is `0.0.1`.

Git history contains no stage release or tag. Release run
[38543425168](https://github.com/anarchitects/anarchitecture-contracts/actions/runs/38543425168)
created the signed `0.0.1` tags without npm publishing. No `publish.yml` runs were
listed during this audit. The user confirmed that npm publication was manual and
explicitly authorized recovery of the missing GitHub Releases using existing tags.
The automatic placeholder creation is supported by npm documentation and inspected
artifacts; no claim is made about an unavailable local CLI command log.

## Scope and safeguards

All five local ADRs and all sixteen Meta ADRs were previously reviewed; upstream
revisions remain `3f5969da055c0799e49e1a9079f135816496c35b` and
`a66c525132cab0e59d12d55a92bb0d1830953f8e`. The release and history guidance was
rechecked for this correction. ADR-0004/Meta ADR-0013 still require actual first
contract distribution at `0.0.1`, immutable release history and Nx versioning.
Recognizing npm's non-code holding artifact does not waive that requirement.

The history gate recognizes only the four inspected, integrity-pinned placeholders
with matching package, exact version, `stub: true`, two-file metadata and tarball
URL. It neither adds them to release history nor invents source commits/tags.
Unknown stage versions, missing/mutated metadata or hashes, and real untagged
versions still fail. The GitHub published-release check remains unchanged,
including for a GitHub Release incorrectly named `0.0.0-stage`. Network/auth errors
still fail closed; only an explicit npm 404 denotes absence.

Tests cover the successful recognition, unchanged release history, missing stub
markers, changed package/version/content identity, extra files and unrelated
untagged prereleases/releases. Verification includes the remote commit/history
path used by CI, in addition to the complete local check and compatibility gates.
No runtime package, wire behavior, version intent or immutable artifact is changed.
No npm deprecation or deletion is proposed: these are documented npm placeholders.

## Authorized GitHub Release recovery

The user explicitly authorized creating the missing `0.0.1` GitHub Releases.
GitHub verified all four annotated tag signatures and their shared commit
`1f8240b62b5533b136610ea44ebf16fe6b7efae4`, which is an ancestor of main.
The manually published npm tarballs passed SHA-512 verification, and their
manifests, OpenAPI files, READMEs and licenses match the tagged files byte for byte.
Package/runtime sources do not differ between that tag and npm's reported
`gitHead` (`3f5969da055c0799e49e1a9079f135816496c35b`).

The releases use the existing tags and committed package changelogs, with a note
explaining this recovery. No tag, version or npm artifact was replaced:

- [Auth 0.0.1](https://github.com/anarchitects/anarchitecture-contracts/releases/tag/auth-contracts%400.0.1)
- [Forms 0.0.1](https://github.com/anarchitects/anarchitecture-contracts/releases/tag/forms-contracts%400.0.1)
- [Identity 0.0.1](https://github.com/anarchitects/anarchitecture-contracts/releases/tag/identity-contracts%400.0.1)
- [Newsletter 0.0.1](https://github.com/anarchitects/anarchitecture-contracts/releases/tag/newsletter-contracts%400.0.1)

Release publication can trigger the historical Publish workflow from the original
tag. That workflow still has the documented old prose/history checks; its status
is separate from the already verified npm distribution. No retry, new npm
publication, workflow approval or deprecation is implied by this recovery.
