# Contract package conventions

`packages/*` is the Yarn workspace location. There are no package manifests here
yet: domain structure and initial package names are finalized in
[issue #4](https://github.com/anarchitects/anarchitecture-contracts/issues/4), after
the [baseline audit](https://github.com/anarchitects/anarchitecture-contracts/issues/3).
Do not publish empty placeholder packages to reserve names.

## Public package requirements

- Use the `@anarchitects` npm scope and a descriptive contract-specific name that
  does not collide with existing Bricks packages. Auth, Forms, Identity and
  Newsletter are the initial domain boundaries, independently versioned.
- Include `name`, `version`, `description`, `license: "MIT"`, repository URL and
  directory, README, license text, an explicit `files` allowlist, and
  `publishConfig.access: "public"`. Publish to the public npm registry.
- Define explicit public `exports` and type declarations. Keep internal paths
  private. Decide module formats and supported Node/TypeScript versions with
  installed-consumer evidence; the root's Node 24 tooling requirement is not a
  blanket runtime requirement for browser-consumed contracts.
- Publish only built runtime code, declarations, intentional contract artifacts
  and documentation. Do not ship development caches, secrets or test-only files.
- Declare required runtime dependencies in the package itself, including Zod
  when used. Do not rely on root hoisting or undeclared consumer dependencies.
  Keep development tools in `devDependencies`.
- Do not introduce runtime or peer dependencies on Nest, Fastify, Express,
  Angular, Nx or implementation repository packages. Audit transitive runtime
  dependencies and the installed artifact as well as direct imports.
- Use explicit public package references for shared wire types. Justify
  cross-domain dependencies; avoid a shared domain model or circular packages.
  Workspace references must resolve to published version ranges when packed.
- Build from a clean checkout and test packed exports and types in a standalone
  consumer without this repository's aliases or framework/tooling dependencies.

## Contract content

Author Zod schemas and inferred types together with first-class HTTP operations:
methods, paths, operation IDs, tags, parameters, request/response/error schemas,
status codes, security requirements and relevant headers/cookies. Generate
deterministic OpenAPI 3.1 JSON/YAML from that source.

Do not author parallel TypeBox or OpenAPI specifications. Transitional TypeBox
material is audited compatibility evidence. Do not move domain invariants,
application logic or `auth-ts` policy evaluation semantics into wire packages.

See [release rules](../docs/releases.md). Package layout, code generation and
module-format implementation are follow-up work, not implied by this checklist.
