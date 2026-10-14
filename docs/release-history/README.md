# Historical release intent

These archived files are evidence only. No release tool reads this directory.
They preserve the five version-plan files from commit
`fbc569ab34ddde2bf78fa2819a38b721550afa1c` byte-for-byte, including the old `0.1.0`
expectation. [ADR-0004](../../adr/0004-package-initial-release-and-nx-versioning.md)
requires an explicit first distribution at `0.0.1` and Conventional Commits for
ongoing version bumps. Nothing here permits publishing or weakens a host blocker.

Initial release review must retain these descriptions and limitations:

- [Auth and Identity](version-plans/auth-identity-first-contracts.md)
- [Forms and Newsletter](version-plans/forms-newsletter-first-contracts.md)
- [OpenAPI artifacts](version-plans/openapi-review-artifacts.md)
- [Profile resolution](version-plans/profile-resolution-gates.md)
- [Nx release documentation](version-plans/nx-release-documentation.md)

The [original Changesets ledger](../../tools/release/changesets-migration.json)
records hashes and exact original rationale for the four historical feature
entries. Both the ledger and archive are retained as evidence, never a second
versioning authority. Historical commit messages remain unchanged.
