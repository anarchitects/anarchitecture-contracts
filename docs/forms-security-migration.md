# Forms D05/D08 migration requirements

Status: security direction accepted; implementation and host evidence outstanding.
The [Contracts #7 decision](https://github.com/anarchitects/anarchitecture-contracts/issues/7#issuecomment-6146764328)
and [Bricks #489 decision](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/489#issuecomment-6146772001)
require remediation. Neither constrained legacy acceptance nor continued public
secret exposure is a release option. Contracts preserves the frozen observations
so the migration remains measurable.

## D05: submissions

The implementing Forms capability must fetch the exact requested form/version,
compile its dynamic field and cross-field rules, and validate on the server before
persistence or delivery. Contracts owns the public request/error shape and this
normative requirement; it does not fetch definitions or compile domain validators.
Client validation is insufficient. Missing definitions remain 404. Invalid dynamic
fields must use the existing 400 bad-request envelope, without exposing Zod issues,
secrets or internal errors. Infrastructure failures remain sanitized server errors.

Required host evidence includes positive submission, missing required field,
invalid dynamic email/type, disallowed properties and cross-field failures,
version selection, and verification that every rejected request caused no
persistence or delivery effects. Authentication, resource ownership and exact
error/serialization behavior need separate positive and negative HTTP evidence.
Legacy fixtures that accepted invalid payloads must remain historical evidence;
add migration-specific fixtures instead of rewriting their observations.

## D08: definitions

The additive `PublicFormDefinitionResponseSchema` omits all delivery configuration.
`PublicFormDefinitionEnvelopeResponseSchema` composes that public config with the
dynamic schema. These are migration targets; the frozen operation still refers
to its legacy response and cannot be released as a supported definition capability.
Strict public validation rejects a leaked delivery field. It is not a redactor:
the host must build the public DTO before serialization and keep secrets out of
the dynamic schema, errors and logs as well.

`FormDeliveryStatusSchema` permits only a configured indicator. Restricted
administration can use that indicator; it must not return webhook secrets or
credential-bearing URLs. The legacy `FormDefinitionResponseSchema.delivery` is
retained solely for compatibility evidence, not as an approved admin read API.
The host owns write-only secret configuration, restricted access, rotation and
remediation of historical exposure. No new administrative endpoint is invented.

Required host evidence covers public serialized responses with configured delivery,
unauthenticated and unauthorized access, resource scope, error paths, administrative
indicators, log redaction and secret rotation. Synthetic fixtures in Contracts
prove DTO rejection and release gating only.

## Versioning, rollout and rollback

This change adds target DTO exports and accepted requirements; it does not switch
an existing route's wire behavior. Conservative compatibility findings and the
pre-1.0 minor release intent are recorded with the #7 artifact migration. The
actual D05 acceptance change and D08 response removal require a separate,
reviewed pre-1.0 minor line (major after 1.0), exact implementation/contract versions
and matching migration records when #489 integrates them.

Roll out by updating consumers to handle the existing 400 envelope and consume
the public target, exercising a candidate host against both migration fixtures
and retained baseline evidence, then reviewing immutable configuration/HTTP reports.
Only then switch canonical route metadata in that versioned migration and remove
the corresponding blocker. Publication #8 consumes that approved evidence.

Rollback must disable the affected capability or return to a previously verified
secure version; it must not restore dynamic-validation bypass or public secrets.
Credential rotation cannot be undone by a package rollback. The implementing host
must document its data/backfill and rollout plan before approval.

Both D05 (`forms.submissions`) and D08 (`forms.definitions`) remain `blocked` in
aggregate and Forms manifests, even when a profile disables those capabilities.
Contracts #7 can close independently once the generator and gates pass their tests.
