# Changesets

Once publishable packages exist, run `yarn changeset` for every public package
change. Select the affected packages, choose a SemVer bump and describe the
consumer-visible change and migration requirements.

Packages have independent versions: `fixed` and `linked` are intentionally empty.
The private workspace root is never versioned or tagged. Changesets does not
commit on your behalf.

Foundation-only changes need no release entry. After Git bootstrap (a committed
`HEAD` and a fetched `origin/main` base), `yarn changeset:status` should report no packages
to release. This command checks the release plan and detects changed versionable
packages with no changesets; it does not prove correct coverage or bump levels.

See [release conventions](../docs/releases.md) for compatibility rules and the
gates required before publishing. Publishing automation belongs to
[issue #8](https://github.com/anarchitects/anarchitecture-contracts/issues/8).
