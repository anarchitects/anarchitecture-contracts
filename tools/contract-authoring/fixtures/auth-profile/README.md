# Frozen Bricks Auth profile oracle

The two TypeScript files are byte-for-byte copies from
[`anarchitecture-bricks-3tier` at `ecda1b6e0d9bc39c66373452a92dce91e06abee0`](https://github.com/anarchitects/anarchitecture-bricks-3tier/tree/ecda1b6e0d9bc39c66373452a92dce91e06abee0/libs/auth/ts/src/contracts).
The source package declares MIT, consistent with this repository's LICENSE. They are immutable
test evidence, not authored canonical schemas or a runtime dependency.

`auth-profiles.test.mjs` checks SHA-256 hashes before bundling the original factory
for differential comparison with pinned Fastify AJV options. Formatting excludes
these exact source files to preserve provenance. Do not update the oracle to make
a changed canonical parser pass.
