# Contract package conventions

[Accepted ADR-0002](../adr/0002-domain-contract-authoring-and-publishing-boundaries.md)
defines the package design for #4. These are selected names and boundaries, not
published packages or reserved npm names. Issue #5 implements [Auth](auth/README.md)
and [Identity](identity/README.md), with real schemas, operations and tests.
Issue #6 implements [Forms](forms/README.md) and [Newsletter](newsletter/README.md).
All four remain unreleased; compatibility records describe explicit release gates.

## Ownership and public entry points

| Workspace / npm name                                         | Owns                                                                                               | Planned public JS/type entry points                                 |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `packages/auth` / `@anarchitects/auth-contracts`             | Session and credential HTTP, JWT transport, passkey JSON ceremonies and policy wire representation | `.`, `./schemas`, `./operations`, `./jwt`, `./passkeys`, `./policy` |
| `packages/forms` / `@anarchitects/forms-contracts`           | Form definition envelope, submission/read transport and operation metadata                         | `.`, `./schemas`, `./operations`                                    |
| `packages/identity` / `@anarchitects/identity-contracts`     | Profile create/read/update transport                                                               | `.`, `./schemas`, `./operations`                                    |
| `packages/newsletter` / `@anarchitects/newsletter-contracts` | Subscription, native action and webhook transport                                                  | `.`, `./schemas`, `./operations`, `./native`, `./webhook`           |

The root exports the domain's explicit public schemas, inferred types and
operation registry. `./schemas` and `./operations` allow focused imports;
capability subpaths export only their own schemas, types and operations.
Auth `./policy` contains HTTP schema/types only, never an evaluator. No wildcard
deep exports, `./models`, `./services`, framework-specific or provider-specific
entry points are introduced. Capability subpaths share the parent version.

The initial dependency graph is four independent domain packages -> Zod. There
are no runtime, peer or transitive dependencies on Nest, Fastify, Express,
Angular, Nx or either Bricks implementation. OpenAPI generation, build tools and
conformance runners are development tools, not dependencies of schema consumers.

## Layout and module artifacts

Implemented workspaces follow this layout; generated artifacts follow in #7:

```text
packages/<domain>/
  src/
    schemas/          Zod schemas, inferred types, stable schema IDs
    operations/       operation values and domain registry
    index.ts          explicit public exports
  test/               schema, semantic, type and export tests
  compatibility/      baseline fixture references and migration decisions
  dist/
    esm/              .js and .d.ts; package type is module
    cjs/              .cjs and .d.cts
  openapi/            generated JSON/YAML per resolved profile, starting in #7
  contract-manifest.json  generated package/version/profile/digest metadata (#7)
  package.json
  README.md
  LICENSE
```

Use `type: "module"`. Each public entry maps `import` to its ESM build and
`require` to its CommonJS build, with the corresponding `types` condition inside
each branch. Compile from one source, including internal relative imports for
each format. Root `main`/`types`, if supplied for tooling compatibility, must agree
with the documented exports. Do not point CommonJS consumers at ESM declarations.
Conditional exports distinguish these entry points in
[Node's package model](https://nodejs.org/api/packages.html#conditional-exports).

Domain registries must have no mutable singleton state or import-time global Zod
registration. Loading both formats must not require schema object identity or
`instanceof` equality between them. Stable schema IDs and structural values are
the cross-artifact identity. Verify module loading and identical behavior from
both builds. Claim `sideEffects: false` only after checking the emitted output.

Initial verification targets are Node 22 and 24 (ESM and CommonJS), TypeScript
5.5 and the repository's selected current compiler (strict NodeNext and bundler
resolution), and an ESM browser bundle with no Node shims. These are targets for
issues #5/#6 and #8; package compatibility records report observed evidence. Pin exact tool versions in implementation
CI; publish only verified ranges and record failures as blockers or an explicit
design amendment. Root Node 24 tooling does not impose a Node requirement on
browser imports. An Angular-specific support claim additionally needs a consumer
build in its owning repository; these packages never require Angular.

## Package manifests and contents

- Set name, independent version, description, MIT license, repository URL and
  workspace directory, README, license text and `publishConfig.access: "public"`.
  Check npm scope permissions and name availability before the first release.
- Use an explicit pack allowlist: built runtime/declarations, README, LICENSE,
  changelog and, once generated, `openapi/` plus `contract-manifest.json`. Do not
  ship source-test fixtures, caches, local aliases, tool source or legacy archives.
- Export generated files explicitly, for example `./openapi/<profile>.json`,
  `./openapi/<profile>.yaml` and `./manifest.json`. They are file artifacts;
  runtime JS must not eagerly load YAML or JSON. No dangling exports before #7
  creates the artifacts. Freeze profile IDs on their first public release.
- Declare the exact tested Zod 4 version as a normal dependency, consistently
  across active packages; do not hide it in root devDependencies or a peer-only
  declaration. Updating it triggers parsing, type and artifact compatibility
  checks for each affected package. No framework dependency may be bundled in.
- A repository-only `HttpOperationDefinition<TSchema>` authoring type lives under
  `tools/contract-authoring/`, introduced in #5. Operations use type-only
  imports and `satisfies`, preserving inferred literal method/path/status types.
  Published declarations must refer only to their own public types, Zod and
  explicitly declared public dependencies. Emit or inline required declaration
  shapes from that single source; never hand-copy types into four packages or
  leave references to private tooling paths. No runtime tooling import is allowed.

## Cross-domain references

An authUserId in Identity is an opaque string with Identity's own transport
constraints, not a dependency on Auth's user entity or ID semantics. Likewise,
host authentication does not make Forms/Newsletter depend on Auth contracts.
No shared `User`, domain model, universal error or common ID schema is created.

If a future operation truly embeds another domain's **public wire representation**,
import that schema by its supported export from the owning contract package.
Record the reason, compatible version, stable schema ID and direction. The graph
must remain acyclic. Prefer passing an opaque reference over embedding a foreign
aggregate; widening a package dependency requires review, not a copied interface.

Use `workspace:^` only for approved internal dependencies; packed manifests must
contain a tested compatible SemVer range, never `workspace:`, source paths or
mutable Git branches. Publication is ordered dependencies first. Host applications
pin an exact released version or immutable artifact for conformance evidence.
The generated manifest records exact resolved dependency versions and schema
origins even when the published package dependency is a compatible range.

## Required package evidence

Extraction must build and pack a workspace, then import/require it from clean
consumers outside the monorepo. Check declarations, all documented subpaths,
excluded private paths, runtime/transitive dependency boundaries and browser
bundling. Run schema fixtures covering raw input, parsed output and serialized
responses, plus non-lossy policy mapping in the owning consumer. Compare with
the [frozen baseline](../baselines/legacy-3tier/README.md), with reviewed
[dispositions](../docs/baseline-dispositions.md).

See [schema conventions](../docs/schema-authoring.md),
[operation definitions](../docs/operation-definitions.md) and
[release rules](../docs/releases.md). No package or consumer support is claimed by
this design document alone.
