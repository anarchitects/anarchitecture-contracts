# Frozen legacy 3-tier HTTP baseline

Evidence for [SI-1.2 / issue #3](https://github.com/anarchitects/anarchitecture-contracts/issues/3),
under [EPIC #1](https://github.com/anarchitects/anarchitecture-contracts/issues/1).
This is **legacy implementation evidence**, not the canonical contract source.
Future contracts are authored in Zod. Do not import these TypeBox-derived JSON
snapshots into runtime packages or copy the legacy DTO implementations as their source.

The audit inventories **29 HTTP operations** across Auth, Forms, Identity and
Newsletter. The committed and regenerated OpenAPI 3.1 files are byte-identical,
but cover only **26 operations / 25 paths**. **123 HTTP scenarios** record the
request, host configuration, response and observed application-port calls.

## Immutable sources and governance

| Repository           | Reviewed revision                                                                                                                                       | Evidence                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Bricks 3-tier        | [`ecda1b6e0d9bc39c66373452a92dce91e06abee0`](https://github.com/anarchitects/anarchitecture-bricks-3tier/tree/ecda1b6e0d9bc39c66373452a92dce91e06abee0) | Controllers, TypeBox DTOs, validators, mappers, generator, Angular consumers; all 19 `docs/adr/` decisions reviewed |
| Meta                 | [`e2f34553c6e2492d0ab6f80ac795de44fc592a70`](https://github.com/anarchitects/anarchitecture-meta/tree/e2f34553c6e2492d0ab6f80ac795de44fc592a70)         | All 15 `adr/` decisions reviewed, including accepted ADR-0012 ownership                                             |
| Contracts foundation | [`44e4db89367521a97f1d4a4917ae2baae880fe15`](https://github.com/anarchitects/anarchitecture-contracts/tree/44e4db89367521a97f1d4a4917ae2baae880fe15)    | Local ADR-0001, package conventions and release rules reviewed                                                      |

Accepted 3-tier ADR-0013 through ADR-0016 gate modernization and preserve the
current implementation during contract extraction. Historical Better Auth
decisions describe the current engine; the proposed native Newsletter amendment
does not override accepted decisions. This audit changes no provider, framework,
domain policy or public API. Authorization-policy semantics remain owned by
`@anarchitects/auth-ts`; the wire representation must preserve them without loss.

[provenance.json](provenance.json) pins the source revision, source-file SHA-256
hashes, capture-tool hashes, artifact hashes, Node version and resolved dependency
versions. The source Git tree, rather than a developer's mutable working tree, is
archived for every replay. The installed source dependency tree is reused read-only.

## Evidence files

| File                                                                                   | Meaning                                                                                                              |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [committed-openapi.json](committed-openapi.json), [YAML](committed-openapi.yaml)       | Exact bytes committed upstream under `docs/openapi/`                                                                 |
| [regenerated-openapi.json](regenerated-openapi.json), [YAML](regenerated-openapi.yaml) | Output of the pinned `tools/api-specs/generate.ts`; identical to committed bytes                                     |
| [committed-operation-snapshot.json](committed-operation-snapshot.json)                 | Upstream simplified operationId snapshot; not a full schema baseline                                                 |
| [route-metadata.json](route-metadata.json)                                             | Exact values of upstream `OPERATION_ID_MAP`, including its obsolete refresh entry                                    |
| [routes.json](routes.json)                                                             | Reflected controller routes, source paths, success statuses and JSON schema values after default Auth schema binding |
| [http.json](http.json)                                                                 | Synthetic requests, fixture controls, selected HTTP response headers/bodies and ordered port calls                   |
| [operations.md](operations.md)                                                         | Endpoint/status/schema/operationId map                                                                               |
| [semantics.md](semantics.md)                                                           | Migration requirements, discrepancy register and consumer map                                                        |

These artifacts are deliberately excluded from automatic formatting. Their exact
bytes and object/array values are checked. JSON object key order is normalized in
capture-owned files; array order, nulls, absence, response values, cookie arrays
and error strings are preserved. Incidental Date, connection and content-length
headers are excluded; Newsletter evidence timestamps become `<clock>`.

## Reproduce

The regular Contracts install needs no Nest, Fastify, Angular or TypeBox dependency:

```sh
yarn install --immutable
yarn check
```

`yarn baseline:check` runs offline integrity, route coverage and semantic evidence
checks. CI runs it through `yarn check`. **It does not start the legacy host or
claim runtime conformance.** Actual HTTP replay is a separate opt-in command:

```sh
yarn baseline:verify ../anarchitecture-bricks-3tier
```

Use Node **24.21.0** and a 3-tier checkout containing the pinned commit, with its
dependencies installed from that revision's lockfile using its pinned Yarn and
`yarn install --immutable`. A separate checkout at that commit is preferable if
your main checkout has other dependency changes. The capture records the actual
resolved versions, including Nest 11.1.6, Fastify 5.4.0, AJV 8.17.1, TypeBox
0.34.41 and TypeScript 6.0.3. Verification compares provenance too: a changed Node
or dependency version must not silently bless a different runtime.

The replay requires Git, tar, the installed source tools, a writable temporary
directory and permission to bind ephemeral **127.0.0.1** ports. It makes real HTTP
requests using Node fetch; it contacts no provider and requires no database.
Source is loaded through ts-node in source-test CommonJS mode, with the upstream
path aliases and decorator metadata. The generator runs in another isolated
archive. Only its `yarn prettier` launcher is adapted to invoke the installed
Prettier binary directly; its route selection and generation logic are unchanged.

To inspect a fresh capture without overwriting frozen evidence:

```sh
node tools/legacy-baseline/capture.mjs capture ../anarchitecture-bricks-3tier /tmp/new-legacy-capture
```

The destination must not exist. `baseline:verify` creates and removes its own
temporary output and compares every evidence file. A drift failure requires
review; do not regenerate expected files simply to make a test pass. Subsequent
implementation revisions need a separate, explicitly reviewed baseline.

## Host profiles and evidence limits

| Profile      | Real code exercised                                                                                                                                               | Controlled boundary                                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `core`       | Auth orchestration, principal and policy mapping, passkey service, JWT service, Forms and Identity controllers/services/mappers, Fastify validation/serialization | Auth engine, password hashing, users/accounts/token repository, passkey verifier, form configuration/submission and profile repositories |
| `guarded`    | Same code plus the actual global AuthenticationGuard and Public metadata                                                                                          | Session engine resolves a synthetic cookie; no product-specific authorization policy or ownership guard is installed                     |
| `newsletter` | Actual `NewsletterModule.forRoot`, presentation hooks, subscription service, rate-limit integration, MailerLite webhook HMAC/parse/mapping                        | Consent repository, subscriber transport and rate-limit port; fixture consent version `v1`, account `42`, 1024-byte webhook limit        |
| `native`     | Actual Newsletter presentation module, native controller, strict validation and failure/header mapping                                                            | Native action ports; no real token lifecycle, database, outbox or mail delivery                                                          |

Cookie values, passwords, signing secrets, tokens, email addresses and webhook
secrets are public synthetic fixture data. Cookie fixtures prove forwarding of
multiple Set-Cookie headers and incoming Cookie values; they do not freeze the
provider's cookie names, SameSite policy, expiry, origin/CSRF configuration or
browser credential behavior. JWT signing and verification and webhook HMAC
verification use real libraries. Passkey assertions exercise JSON validation and
delegation; they are not cryptographically valid WebAuthn ceremonies.

No host-wide `/api` prefix, CORS policy or production guard composition is assumed.
The core profile intentionally has no global guard so that schema and service
behavior is observable. Guarded cases separately demonstrate 401 behavior; they
do not establish authorization for every deployment. A core-profile 200 does not
mean that the operation should be anonymously accessible in a product.

Angular clients are source-audited, not executed. Source-level replay is not a
packed-package, browser, PostgreSQL durability or live-provider test. Existing
upstream runtime-security, controller integration and Newsletter example contract
tests remain useful follow-up evidence, but their full suites were not run by
this capture. Publication/adoption claims in #8 still require independent packed
consumer, policy-evaluation, browser/provider and deployment conformance checks.
