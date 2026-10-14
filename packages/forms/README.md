# @anarchitects/forms-contracts

Zod-first HTTP schemas, inferred types and operation definitions for the existing
Forms definition, submission and read surface. The published `0.1.0` artifacts
remain immutable. The D08 correction targets the next breaking minor release,
`0.2.0`, through Nx Conventional Commits. Both host capabilities retain the
D05/D08 evidence gates; package publication alone establishes no host support.

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
schemas, send mail or evaluate form rules. `getFormDefinition` uses the existing
`PublicFormDefinitionEnvelopeResponseSchema` and rejects all delivery configuration.
Legacy `FormDefinitionResponseSchema` and `FormDefinitionEnvelopeResponseSchema`
remain exported for migration comparisons only, never as the normative public
response or an approved administrative secret-read API.

`formsOperations` retains four historical operationIds. `formsProfiles` requires
unresolved host protection; `formsReleaseBlockers` records D05 (dynamic validation
bypass) and D08 (delivery-secret forwarding), with maintainers responsible for
review. These values must not be treated as stable capability approval.

Repository checks compare the frozen HTTP evidence, expanded AJV inputs, response
formats and packed consumers. See `packages/forms/compatibility/README.md` in the
source repository for exact scope, source revisions and remaining gates.
OpenAPI/profile generation is implemented by #7; #8 owns publication, and
runtime integration belongs to Bricks adoption work.

## Canonical artifacts and separate host conformance

Explicit exports include `./openapi/forms-canonical.json` and its YAML
sibling, `./openapi/inventory.json` and `./manifest.json`. Existing
`./openapi/forms-review.json`/YAML exports remain diagnostic. Runtime imports
do not load these files; clean tarball consumers verify them independently.

Canonical artifacts are implementation-independent and publishable without a host
after contract validity, compatibility and package checks. Format-2 manifests
separate publication validity, implementation conformance and deployment compliance.
They claim no supported capabilities or deployment readiness. Protected operations
remain in the inventory with normative security obligations and stay excluded from
OpenAPI paths until host bindings resolve. P07 reviews remain scoped and pinned;
OpenAPI-only validation cannot replace canonical Zod parsing.

Forms has already been distributed: package changes use normal Nx Conventional
Commits with the exact `forms-contracts` project scope. The security-driven wire
change uses breaking notation and requires a pre-1.0 minor release.
Hosts consume exact published versions and independently prove positive/negative
HTTP behavior, security, headers and cookies before claiming support. See
`docs/openapi.md`, `docs/releases.md` and ADR-0005 in the source repository.

`PublicFormDefinitionResponseSchema` and its envelope are the normative D08
response. `FormDeliveryStatusSchema` permits a configured indicator only.
Protected profiles require public projection, secret-free serialization and
restricted secret configuration/rotation evidence in addition to authentication
and resource authorization. D05 dynamic validation remains a separate host
requirement. See `docs/forms-security-migration.md` and Contracts #25.
Bricks #490 must pin the published version and verify actual HTTP before claiming
full Forms conformance.
