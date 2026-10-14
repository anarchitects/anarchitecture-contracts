---
forms-contracts: minor
newsletter-contracts: minor
---

Introduce the first Zod-first Forms and Newsletter HTTP contracts with inferred
input/output types, eight operation definitions and dual ESM/CommonJS exports.
Preserve legacy coercion, strict Newsletter input and UTF-16 limits, honeypot
ordering, signed webhook raw-body/header obligations, response/error shapes and
existing operationIds. No new runtime business logic or intended wire migration
is introduced.

These are unreleased development workspaces. Forms D05 (dynamic validation bypass)
and D08 (delivery-secret forwarding) remain explicit stable capability blockers.
Native schema projection and resolved host profiles require #7 decisions before
release; publication and independent conformance remain #8. Consumer adoption
and any validation/redaction migration require separate reviewed Bricks work.
