# @anarchitects/newsletter-contracts

Zod-first HTTP schemas, inferred types and four operation definitions for the
existing Newsletter subscription, native action and signed webhook surface.
This package is unreleased at `0.0.0`, pending an initial Changesets minor release.
It does not implement consent storage, subscription delivery or token lifecycle.

The root exports schemas, `newsletterSchemas`, `newsletterOperations` and
unresolved `newsletterProfiles`. Focused exports are `./schemas`, `./operations`,
`./native` and `./webhook`. ESM/CommonJS builds have separate declarations; Zod
4.5.0 is the sole runtime dependency.

`NewsletterSubscriptionRequestSchema` is the normal strict consent request.
`NewsletterSubscribeRequestSchema`, used by the operation, also accepts the
legacy honeypot branch: any nonempty website string returns neutral 202 before
normal validation, rate limiting or side effects. A successful parse of that
union is not permission to record consent. Unknown keys are rejected on the
normal branch. There is no coercion, trimming or email lowercasing in the parser.
String limits preserve the legacy UTF-16 count explicitly.

Native confirm/unsubscribe accept strict token objects, including empty strings,
and require no-store/no-referrer headers on enabled controller outcomes. GET and
disabled actions remain unsupported. Token purpose, expiry and reuse checks stay
with the implementation.

The webhook operation requires exact raw bytes and a 64-hex-character signature.
The signature schema validates shape only. The host must enforce byte limits and
verify HMAC before decoding/validating the parsed MailerLite payload profile.
Account matching, event limits, durable deduplication and persistence remain
implementation obligations. Payload schemas preserve event/type aliases, batches,
conditional withdrawal fields and ignored event types without provider calls or
business-state changes. Never sign reserialized parsed JSON.

Repository tests compare frozen and supplemental HTTP evidence, strict TypeBox
acceptance, Unicode limits and packed consumers. See
`packages/newsletter/compatibility/README.md` in the source repository for evidence
and limits. Request generation has explicit #7 gates for UTF-16 lengths, decoded
numeric overflow and conditional webhook refinements. Publication/conformance
remains #8; package existence does not establish runtime adoption.

## Generated review artifacts

Explicit file exports now include `./openapi/newsletter-review.json`,
`./openapi/newsletter-review.yaml`, `./openapi/inventory.json` and `./manifest.json`.
They are generated from these canonical schemas and operations and are verified
in clean tarballs. Runtime imports do not load the files.

The files are **review-only** and claim no supported deployment capabilities.
Projection proposal P07 is not approved; protected routes remain in the inventory
until host security bindings are resolved. Review `docs/openapi.md` and
`docs/openapi-projection-proposal.md` in the source repository before using them.
