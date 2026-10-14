# @anarchitects/newsletter-contracts

Zod-first HTTP schemas, inferred types and four operation definitions for the
existing Newsletter subscription, native action and signed webhook surface.
This package is unreleased at `0.0.0`, pending the explicit first Nx release at `0.0.1`.
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

## Canonical artifacts and separate host conformance

Explicit exports include `./openapi/newsletter-canonical.json` and its YAML
sibling, `./openapi/inventory.json` and `./manifest.json`. Existing
`./openapi/newsletter-review.json`/YAML exports remain diagnostic. Runtime imports
do not load these files; clean tarball consumers verify them independently.

Canonical artifacts are implementation-independent and publishable without a host
after contract validity, compatibility and package checks. Format-2 manifests
separate publication validity, implementation conformance and deployment compliance.
They claim no supported capabilities or deployment readiness. Protected operations
remain in the inventory with normative security obligations and stay excluded from
OpenAPI paths until host bindings resolve. P07 reviews remain scoped and pinned;
OpenAPI-only validation cannot replace canonical Zod parsing.

First distribution is exactly `0.0.1`; pre-release development uses non-bumping
`init(newsletter-contracts)` commits, and later versions use Nx Conventional Commits.
Hosts consume exact published versions and independently prove positive/negative
HTTP behavior, security, headers and cookies before claiming support. See
`docs/openapi.md`, `docs/releases.md` and ADR-0005 in the source repository.
