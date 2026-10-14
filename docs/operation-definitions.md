# First-class HTTP operation definitions

[ADR-0002](../adr/0002-domain-contract-authoring-and-publishing-boundaries.md)
accepts this protocol design. #5 introduces the shared repository-only authoring
type and Auth/Identity definitions; #6 applies it to Forms/Newsletter. #7 implements
registry validation and deterministic OpenAPI generation. The executable
[generation guide](openapi.md) describes the implementation and remaining
projection/profile review gates. This protocol implements no operation runtime.

## Authored values

Export named lowerCamelCase operation constants and a readonly domain registry
(`authOperations`, `formsOperations`, `identityOperations`, `newsletterOperations`).
Use a type-only `HttpOperationDefinition<TSchema>` check with `satisfies`, preserving
literal types and references to the actual Zod schemas. The type is authored once
under repository tooling and must not leak into published declaration imports.
The protocol contains data and schema values, never route handlers, middleware,
authorization evaluators or executable host predicates.

The following field names and meanings are the design contract for that type.
Named nested records are specified below. Empty collections are explicit; omission
must not imply that a security requirement or response was considered and cleared.

| Field                    | Required shape / rule                                                                                                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain`                 | One of `auth`, `forms`, `identity`, `newsletter`; equals package ownership                                                                                                                                           |
| `capability`             | Stable domain-qualified ID, such as `auth.session`, `auth.jwt`, `auth.passkeys`, `forms.definitions`, `forms.submissions`, `identity.profiles`, `newsletter.subscription`, `newsletter.native`, `newsletter.webhook` |
| `operationId`            | Stable globally unique string; retain the 26 audited IDs                                                                                                                                                             |
| `method`                 | Uppercase HTTP method literal; no implicit HEAD/OPTIONS support                                                                                                                                                      |
| `path`                   | Absolute relative-to-host path, using `{parameter}` placeholders; no origin, `/api` prefix or query text                                                                                                             |
| `tags`                   | Nonempty ordered tag IDs; preserve existing tags unless a reviewed tooling change is intended                                                                                                                        |
| `summary`, `description` | Consumer-facing purpose and behavior, with no implementation class names                                                                                                                                             |
| `parameters`             | Array of parameter records; `[]` means none                                                                                                                                                                          |
| `requestBody`            | Explicit `none`, `json` or `raw` body record                                                                                                                                                                         |
| `responses`              | Nonempty map of exact HTTP status strings to response records; success and error outcomes share this one source                                                                                                      |
| `security`               | Explicit public, required or profile-bound security record                                                                                                                                                           |
| `availability`           | `always` or a named profile/capability binding; disabled operations are omitted from that resolved document                                                                                                          |
| `semantics`              | Ordered semantic requirements with stable IDs, descriptions, phase and evidence references; `[]` only after review                                                                                                   |
| `compatibility`          | Baseline revision, matching legacy route key, fixture IDs, discrepancy dispositions and any reviewed migration reference                                                                                             |
| `deprecated`             | Explicit boolean; deprecation never removes a route or changes runtime behavior by itself                                                                                                                            |

Do not infer operationIds from controller names. Preserve the route-to-ID mapping
in the [legacy operation table](../baselines/legacy-3tier/operations.md). New IDs
for the undocumented JWT operations are decided here:

| Method/path              | New ID in #5       | Compatibility meaning                                |
| ------------------------ | ------------------ | ---------------------------------------------------- |
| `POST /auth/jwt/login`   | `loginWithJwt`     | Adds missing documentation; same existing wire route |
| `POST /auth/jwt/logout`  | `logoutWithJwt`    | Adds missing documentation; same existing wire route |
| `POST /auth/jwt/refresh` | `refreshJwtTokens` | Adds missing documentation; same existing wire route |

The orphan `refreshTokens` ID for `/auth/refresh-tokens/{userId}` is not reused.
An aggregate fails on duplicate operationIds or method/path pairs; it never
silently renames an ID or selects whichever package was loaded last.

## Parameters, bodies and responses

A parameter record has `in` (path/query/header/cookie), `name`, `required`,
`schema`, `description` and an explicit serialization record (`style`, `explode`,
and `allowReserved` where applicable). Path placeholders must exactly match
required path parameters. Header identity is case-insensitive. Never turn query
repetition, comma splitting, empty values or encoded slashes into implicit defaults;
freeze the supported encoding and validate the actual host's decoding behavior.

A body record is discriminated by `kind`:

- `none`: no documented body. A successful bodyless response also uses this form;
  it is not a schema accepting arbitrary content.
- `json`: `required` plus a `content` media-type map to actual schema references.
  JSON decoding precedes validation. A request schema may have distinct input and
  parsed-output types as described in [schema authoring](schema-authoring.md).
- `raw`: `required`, media type, optional parsed JSON schema, and semantic
  requirements for byte preservation, size checks and verification ordering.
  No Node Buffer or framework request type enters the contract. Webhook HMAC
  verification remains an implementation responsibility; fixture inputs preserve
  exact bytes and signature headers.

A response record contains `outcome` (`success` or `error`), `description`, body
record, `headers` and semantic references. It is keyed by the exact status, so
there is no separate error list to drift. Different observed shapes for the same
status use an explicit schema union and fixture coverage. Baseline errors include
both `{statusCode,message}` and `{statusCode,message,error}`; do not standardize
them to a new error format during extraction. Do not use a generic `default`
response to conceal missing 400/401/404/413/429/503 cases. Broader host failures
require their own documented support scope, not invented operation outcomes.

Header records include normalized name, value schema, presence condition and
cardinality (`single` or `repeated`). Preserve individual Set-Cookie values;
never collapse them to a comma-joined header. Describe forwarding and invalidation
requirements without making fixture cookie names/values a production promise.
Retry-After, Cache-Control and Referrer-Policy are explicit for relevant outcomes.
For no-body statuses such as 204, forbid a content schema. This rule does not add
204 to any legacy operation.

## Security and resolved profiles

Security is mandatory and discriminated. Public operations emit `security: []`
explicitly, overriding any document-level requirement. Required operations never
include an empty `{}` alternative:

| Kind       | Meaning                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| `public`   | No credential prerequisite for this operation; explicitly emits operation-level empty security requirements |
| `required` | Nonempty alternatives of scheme requirements; each alternative requires all its listed schemes              |
| `profile`  | Named binding resolved by an approved profile; unresolved security is an error, never a public default      |

Scheme definitions are package-owned transport metadata or explicit profile
bindings, not imports of Auth user models. Distinguish session-cookie transport,
bearer credentials and webhook signatures from credentials/tokens supplied in a
JSON login or refresh body. A JWT login operation being Public does not make
refresh-token verification optional. Webhook security includes both its signature
header and byte-verification semantics; an OpenAPI apiKey declaration alone does
not specify HMAC correctness.

OpenAPI combines schemes within one requirement with AND and alternative
requirements with OR. Its empty requirement object allows anonymous access;
generation must never introduce that alternative unintentionally. See the
[OpenAPI 3.1 security requirements](https://spec.openapis.org/oas/v3.1.1.html#security-requirement-object).
Authorization remains a separate semantic requirement: possession of a cookie
does not establish ownership or permission to act on another user's resource.

An authored profile has a stable ID, enabled capabilities, security bindings and
declared host behavior requirements. Profile bindings may resolve deployment
details such as cookie names or host prefix; they cannot replace the operation's
schema or loosen an established security requirement. Changes to a supported
profile are versioned contract changes. Host origin/base URL is deployment data.

In #5/#6, enumerate reviewed profiles based on evidence rather than taking every
combination of feature flags. Distinguish Auth core/session/JWT/passkey composition,
Forms/Identity host protection and Newsletter native/webhook availability. The
baseline's `core`, `guarded`, `newsletter` and `native` fixture labels are test
configurations, not approved deployment profiles. Do not promote its unguarded
core 200s into anonymous capability claims.

A host-resolved domain artifact describes one fully resolved profile. Canonical
artifacts under [ADR-0005](../adr/0005-independent-contract-publication-and-implementation-conformance.md)
are separately publishable: they retain unresolved obligations and exclude
unbound protected paths without claiming support. Disabled routes
are omitted, and unsupported capabilities stay explicit in the support manifest.
Diagnostic inventories may contain unresolved operations, but cannot be released
as a deployable conformance profile. A deployment must name the exact contract
versions, profile, host bindings and verified capability subset it implements.

## Non-schema semantics and generation gates

Each semantic requirement identifies a stable ID, the transport phase
(pre-validation, normalization, authentication/authorization, application outcome
or response), a normative description and positive/negative fixture references.
Examples include honeypot-before-validation, raw-byte signature checks, grant
persistence before subscriber calls, ordered policy mapping and cookie forwarding.
The metadata expresses obligations, not an implementation of them. Provider
configuration and business invariants remain in their owning bounded context.

Generation rejects unresolved schemas and, for host mode, unresolved profiles;
it also rejects missing error/security/header
definitions, invalid path parameters, duplicate IDs/routes and unsupported schema
conversion. Its generator uses Zod schema objects and this operation registry;
it must not boot Nest or scrape decorators. Emit deterministic OpenAPI 3.1 JSON
and YAML plus a manifest containing exact package versions, dependency versions,
profile IDs, schema origins, source revision and artifact digests. Exclude build
timestamps and machine paths from reproducible artifacts.

For cross-domain composition, namespace generated references by owning domain
and stable schema ID, bundle referenced schemas from exact resolved packages,
and record their origins. Do not resolve schemas from mutable remote URLs at
runtime. An aggregate's title/build identity is not a new shared SemVer version;
the manifest is the authoritative list of independently versioned inputs.

Tests added with the implementation must exercise these validation failures as
well as successful generation. They must separately verify request acceptance,
response serialization, security and header behavior; a matching schema document
alone does not prove conformance.
