---
auth-contracts: minor
identity-contracts: minor
---

Introduce the first Zod-first Auth and Identity HTTP contracts, with inferred
input/output types, 21 operation definitions and dual ESM/CommonJS exports.
Preserve the frozen session/JWT/passkey and profile wire semantics, including
coercion, nullable fields, policy order, cookie obligations and existing operation
IDs. Assign IDs to the three previously undocumented JWT routes; do not restore
the obsolete refresh-tokens endpoint.

These initial development packages do not claim deployment adoption. Request
JSON Schema projection and resolved host security profiles remain release gates
for issue #7; publication and independent conformance remain issue #8. Consumers
must retain their current immutable pins until those gates and their runtime
adoption checks pass. No intentional wire migration is introduced.
