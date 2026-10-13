# Newsletter extraction record — issue #6

## Scope and provenance

`@anarchitects/newsletter-contracts` is an unreleased `0.0.0` workspace with a
pending initial minor Changeset for `0.1.0`. Reviewed all 15 Meta ADRs at
`e2f34553c6e2492d0ab6f80ac795de44fc592a70`, both local ADRs at Contracts
`3155a388d4d3482a650bf48b43a9c51933c63aa2`, and the relevant authoring/release
and baseline guides. Applicable accepted decisions and proposal boundaries are
recorded in the [Forms review](../../forms/compatibility/README.md#scope-and-review).

The [immutable #3 baseline](../../../baselines/legacy-3tier/README.md) pins Bricks
3-tier to `ecda1b6e0d9bc39c66373452a92dce91e06abee0`. `newsletterOperations` retains
all four historical operationIds, methods, paths and statuses. Each operation
links its frozen fixtures. The new [supplemental evidence](legacy-http.json)
records source hashes and 23 additional HTTP cases without changing #3 evidence.
No intended wire migration, provider change or adoption claim is introduced.

## Preserved boundaries

**Subscription (D03/D04).** Normal requests reject unknown keys and do not coerce,
trim or lowercase input. Consent is literal true; version equality is a host
application check. Email, source and website limits count UTF-16 units as the
legacy TypeBox `Value.Check` did. Zod 4.5 and JSON Schema count code points, so
explicit additional length checks prevent a silent expansion for non-BMP text.
The schema uses the audited email regex rather than a generic email validator.

The operation's request schema is a union with an explicit honeypot branch:
any nonempty website string, even over the normal limit, returns neutral 202
before ordinary shape validation, rate limiting and service work. It must not
create grant evidence. On the normal branch the application lowercases email,
checks the configured consent version, appends the grant before subscriber
transport and retains the grant if transport fails. These obligations are
metadata, not service logic in Contracts. Rate denial is 429 with Retry-After
seconds rounded up; limiter/context/storage/provider failure is sanitized 503.

**Native actions (D03/D04/D09).** POST confirm/unsubscribe use strict token objects,
including empty strings, with the existing UTF-16 limit of 128. Responses remain
neutral 202. Enabled controller outcomes carry no-store/no-referrer, including
validation and service errors; malformed JSON can fail before those headers are
set. GET and disabled routes remain 404 without actions. 429 is documented from
the shared limiter path; the frozen native host disables that limiter, so native
429 runtime behavior is not independently proven here. Token purpose, expiry,
reuse, double opt-in and link delivery stay with native lifecycle implementations.

**Webhook (D03/D09).** A required 64-hex signature describes SHA-256 HMAC transport;
shape validation does not authenticate a request. The host must preserve exact
raw bytes, enforce the configured byte limit and verify the signature before
UTF-8/JSON decoding and payload work. Existing raw-body absence, signature,
payload/account, size and storage failures retain 503/401/400/413/503 outcomes.
Host JSON decoding can fail before controller entry and must be tested separately
for any new adapter.

The parsed MailerLite profile represents single events or an events batch,
event/type aliases, consistent names, optional numeric/string account IDs,
conditional subscriber IDs/email/timestamps and supported fallback fields.
Well-formed unhandled event names remain ignored; empty batches remain valid.
Account equality and event-count limits are host configuration checks. Validate
the entire batch before any write. Preserve timestamp precision and stable
deduplication identity in the owning implementation; schema parsing does not
lowercase emails, compute hashes or store withdrawals. Declaring raw input does
not permit bypassing the attached parsed-schema and signature obligations.

## Evidence and remaining gates

- Frozen tests validate all 55 Forms/Newsletter responses, errors and applicable
  headers. Expanded Newsletter inputs are compared directly with TypeBox 0.34.41
  using immutable route metadata with restored Kind symbols. This development
  dependency is excluded from runtime tarballs.
- Supplemental HTTP probes cover aliases, batch ordering, ignored events, timestamp
  fallbacks, numeric IDs, invalid timestamps, conflicting fields, Unicode email/
  token limits, honeypot ordering and malformed-JSON headers. Invalid batches
  produce no persistence events. These are controlled collaborators, not evidence
  of durable database idempotency or production mail behavior.
- Clean tarballs pass every ESM/CommonJS export on Node 22.13.0/24.21.0,
  TypeScript 5.5.4/6.0.3 strict NodeNext/bundler consumers and browser bundling.
  Only Zod 4.5.0 is a runtime dependency. No framework, provider or other domain
  is imported by this package.
- **Generation (#7):** decoded numeric overflow makes native input conversion
  fail explicitly. UTF-16 limits and webhook conditional/timestamp refinements
  additionally exceed naive native projection; tests demonstrate a generated
  maxLength accepting input the legacy runtime rejects. A successful converter
  call is not equivalence. Resolve these constraints or obtain a reviewed
  exception before releasing affected operations; no manual schema fallback.
- **Profiles/adoption:** capability flags and host bindings remain unresolved;
  generated artifacts must omit disabled routes. The fixture host labels are not
  approved deployment profiles. Real signature integration, byte/event limits,
  consent/rate policy, native lifecycle and persistence need host evidence in
  [3-tier #489](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/489).
  Publication/provenance and independent conformance remain #8.

## Reproduce the supplemental HTTP evidence

Use the same source checkout/dependency prerequisites as the #3 baseline harness.
This optional audit runner needs loopback HTTP access and legacy source packages;
normal `yarn check` consumes only committed evidence and development validators.

```sh
node tools/contract-authoring/probe-legacy6.mjs ../anarchitecture-bricks-3tier
```

The default mode verifies all captured results against `legacy-http.json`.
Explicit `record` replaces this supplemental record and requires review of every
changed outcome. It never rewrites the frozen #3 baseline or changes runtime
packages. The supplemental data and audit tooling are excluded from npm tarballs.

## Issue #7 generation status

Generated JSON/YAML review artifacts, inventories and package manifests now exist.
The [generation guide](../../../docs/openapi.md) and
[reviewed, scoped projection register P07](../../../docs/openapi-projection-proposal.md)
record faithful constraints, remaining exceptions and strict profile/evidence gates.
Synthetic verification is test-only; actual host evidence and capability blockers
remain outstanding. Existing legacy parsers and frozen HTTP observations are
preserved. #7 can complete independently of host remediation and #8 publication.
