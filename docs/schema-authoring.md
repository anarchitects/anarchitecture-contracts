# Zod schema and inferred type conventions

This is the authoring design accepted by
[ADR-0002](../adr/0002-domain-contract-authoring-and-publishing-boundaries.md).
Implement it in #5/#6 using the [baseline dispositions](baseline-dispositions.md).
Schema existence does not prove consumer migration or HTTP conformance.

## Source, identity and inferred types

Author a transport concept once as a named Zod 4 value. Use PascalCase schema
names ending in `Schema`, such as `RegisterRequestSchema`, and infer exported
TypeScript aliases from that value. No manually maintained parallel DTO interface,
TypeBox schema, JSON Schema literal or OpenAPI schema is allowed. Reuse the same
schema object in operations; operation metadata never restates its properties.

| Export                  | Definition / use                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| `RegisterRequestSchema` | The canonical request schema, including any reviewed transport-only normalization                |
| `RegisterRequestInput`  | `z.input<typeof RegisterRequestSchema>`; values accepted before that normalization               |
| `RegisterRequest`       | `z.output<typeof RegisterRequestSchema>`; parsed values supplied to the implementation boundary  |
| `RegisterResponse`      | `z.infer<typeof RegisterResponseSchema>`; serialized wire response, not a service return model   |
| `AuthOperation`         | Inferred union from the exported `authOperations` registry; method/path/status literals retained |

All four domains implement this convention in issues #5/#6.
Export no domain entity named `User` merely because a response contains `user`.
Consumer mappings from domain/service models stay in the consumer repository.
Keep old Bricks DTO export aliases there during migration if needed; Contracts
does not re-export implementation packages.

Each public schema has one stable, domain-qualified ID, such as
`auth.RegisterRequest`, `auth.jwt.LoginResponse` or `identity.UserProfileResponse`.
Register IDs explicitly in a package-owned immutable catalog pairing ID and
schema object, not in a process-global registry. The generator derives reference
names from these IDs and distinguishes `.Input`/`.Output` when required; authors
do not separately maintain component schemas. A schema ID is not a package
version. The release manifest supplies the exact version and source digest.

Generation must reject duplicate IDs with different definitions and unregistered
external schema references. OperationIds and schema IDs have separate namespaces.
Published ID/export renames require compatibility review because generated clients
can depend on their names even if the JSON payload is unchanged.

## JSON and transport boundaries

Schemas describe JSON-compatible values at named HTTP boundaries. Body JSON is
decoded before its request schema is applied. Path/query/header values have
explicit [encoding rules](operation-definitions.md); parsing an integer query
value is not the same as accepting every JavaScript value via coercion.

- Distinguish required, optional, nullable and optional-nullable properties.
  Use `.optional()` for omission and `.nullable()` for JSON null; never apply a
  blanket `.partial()` to responses. Undefined is not a JSON value.
- Give every object an intentional unknown-key policy: reject, strip, preserve
  or validate via a catchall. Zod's normal object parsing strips unknown keys;
  strict and loose objects provide other behavior. Select deliberately and test
  nested objects as well as the top level; see the
  [Zod object APIs](https://zod.dev/api#objects).
- Keep date/time wire fields as strings, binary ceremony fields as encoded
  strings, and IDs as the audited strings. No Date, Buffer, BigInt, Map, Set,
  class instance or DOM/server type belongs in a JSON response contract.
- Use the audited format/pattern/length/range. Do not replace legacy email,
  UUID, URI or base64url acceptance with a similarly named Zod convenience check
  without comparing positive and negative cases. Preserve unpadded base64url,
  integer limits and nullable fields where supported.
- Defaults apply only at the observed boundary. An internal service default
  does not make a required HTTP field optional. A documented default annotation
  is not proof that any validator inserts that value.
- Responses validate the serialized JSON output. They do not convert Date models,
  select profile fields or serialize cookies; those adapter operations need HTTP
  fixtures. No response schema may silently coerce a wrong implementation output
  into a passing conformance result.

## Normalization and generation

Request schemas may contain a pure, deterministic transport pipeline only when
needed to preserve observed behavior. Bound the accepted input explicitly, then
normalize it and validate the parsed result. Name both inferred input/output
types. A coercer accepting `unknown` or arbitrary JavaScript truthiness must not
accidentally broaden JSON acceptance. Keep cross-field business decisions,
consent policy lookups, password hashing, WebAuthn verification and authorization
evaluation in their owning implementations.

For example, preserving Identity null-to-empty-string behavior requires an
explicit nullable input branch and reviewed normalization; a plain nullable
string with no pipeline behaves differently. Preserving Forms integer coercion
requires checking the source validator's accepted/rejected inputs, not merely
copying the single `"2"` fixture. The 123 audited scenarios are a starting set,
not an exhaustive equivalence proof. Expand boundary cases during extraction.

Use native Zod 4 JSON Schema conversion as the initial #7 generation path,
targeting JSON Schema Draft 2020-12 for OpenAPI 3.1. Request/parameter generation
uses the schema's **input** view; response generation uses its **output** view.
Zod documents the input/output distinction and unrepresentable constructs in
[its conversion reference](https://zod.dev/json-schema). Pin and verify the exact
converter version; keep failure on unrepresentable constructs enabled.

The input side of any normalization pipeline must have a faithful schema
representation. Generation must not emit `{}` for a transform it cannot express,
override `type`/`required` by hand, or use opaque refinements while claiming that
OpenAPI captures their acceptance constraints. A needed behavior outside JSON
Schema belongs in explicit operation semantics and conformance evidence; if
that would make the input description misleading, block that operation's release
until a representable design or reviewed exception is agreed. No second authored
schema is introduced to work around conversion.

Input and output must also be distinguished for stripping objects: a parser can
accept an extra key and omit it from the parsed result. The generated request
must not advertise that key as rejected solely because the output is closed.
Tests must compare acceptance, parsed values and serialized response bytes/values
at the relevant boundary, not only compare inferred types.

## Runtime semantics beyond schemas

An operation can succeed or fail based on session state, current consent version,
account existence, a signature, rate limit or application state. Its schema cannot
decide these facts. Record their required statuses, headers, behavior and fixture
references in the operation definition. The implementation supplies the behavior;
independent conformance probes it.

Newsletter's honeypot short-circuit is a transport behavior before normal payload
validation; extraction must model that accepted input branch and its neutral 202
outcome explicitly. Webhook signatures bind raw request bytes, not reserialized
JSON. Declaring an unconstrained webhook payload without the required signature
and raw-body semantics is insufficient.

Auth policy JSON may validate fields, conditions and rule arrays. It must preserve
rule order and all supported wire fields, including inverted denials and reason.
It must not expand wildcards, evaluate conditions, reorder rules, add grants or
make CASL/Nest authorization decisions. The owning auth-ts semantic fixtures and
consumer mapping tests supply policy parity evidence.

## Extraction evidence

For every operation, record baseline fixture IDs, old/new acceptance and parsed
values, success/error serialization, unknown-key behavior, omitted/null/default
cases, format boundaries and security/host profile. Record unproven behavior as a
gap. Schema tests and packed type tests belong in #5/#6; generated artifact checks
and independent conformance gates follow in #7/#8. Any intentional wire change
needs the decision and release intent required by [release rules](releases.md).
