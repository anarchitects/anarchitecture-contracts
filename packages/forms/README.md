# @anarchitects/forms-contracts

Zod-first HTTP schemas, inferred types and operation definitions for the existing
Forms definition, submission and read surface. This package is unreleased at
`0.0.0`, pending an initial Changesets minor release. Both stable capabilities
remain blocked by the recorded D05/D08 security dispositions.

The root, `./schemas` and `./operations` provide ESM and CommonJS exports with
format-specific declarations. Zod 4.5.0 is the only runtime dependency. No Auth,
Nest, Fastify, TypeBox, AJV or domain-model dependency enters this package.

Requests preserve legacy primitive/singleton-array coercion, open payloads,
unknown query properties and positive integer versions. `SubmissionRequestInput`
and `SubmissionRequest` describe the raw and parsed forms. The submit version
stays required; only the definition controller supplies version 1 after parsing
an omitted query version. No pagination or dynamic field validation is added.

Responses validate the serialized config/schema envelope and unpaginated
submission array. They do not serialize Dates, project fields, generate dynamic
schemas, send mail or evaluate form rules. Delivery config remains visible in the
audited response, including webhook secrets; preserving this evidence is not
approval to expose those values in a deployment.

`formsOperations` retains four historical operationIds. `formsProfiles` requires
unresolved host protection; `formsReleaseBlockers` records D05 (dynamic validation
bypass) and D08 (delivery-secret forwarding), with maintainers responsible for
review. These values must not be treated as stable capability approval.

Repository checks compare the frozen HTTP evidence, expanded AJV inputs, response
formats and packed consumers. See `packages/forms/compatibility/README.md` in the
source repository for exact scope, source revisions and remaining gates.
OpenAPI/profile generation is implemented by #7; #8 owns publication, and
runtime integration belongs to Bricks adoption work.

## Generated review artifacts

Explicit file exports now include `./openapi/forms-review.json`,
`./openapi/forms-review.yaml`, `./openapi/inventory.json` and `./manifest.json`.
They are generated from these canonical schemas and operations and are verified
in clean tarballs. Runtime imports do not load the files.

The files are **review-only** and claim no supported deployment capabilities.
P07 exceptions are reviewed per operation and pinned to source/generator bytes.
Real host evidence remains unresolved; protected routes remain in the inventory
until host security bindings are resolved. Review `docs/openapi.md` and
`docs/openapi-projection-proposal.md` in the source repository before using them.

The additive `PublicFormDefinitionResponseSchema` and
`PublicFormDefinitionEnvelopeResponseSchema` are D08 migration targets without
delivery configuration. `FormDeliveryStatusSchema` permits a configured indicator
only. The legacy route is still frozen and blocked. See
`docs/forms-security-migration.md` for D05 validation, D08 redaction and rollout
requirements owned by Bricks #489.
