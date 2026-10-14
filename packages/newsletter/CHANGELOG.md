## 0.1.1 (2026-10-14)

### 🩹 Fixes

- ⚠️  **forms-contracts:** use safe definitions and classify scoped provenance ([#26](https://github.com/anarchitects/anarchitecture-contracts/pull/26))

### ⚠️  Breaking Changes

- **forms-contracts:** use safe definitions and classify scoped provenance  ([#26](https://github.com/anarchitects/anarchitecture-contracts/pull/26))
  getFormDefinition rejects delivery configuration. Retain legacy schema exports for migration evidence and require protected host redaction and rotation evidence. P07 source-pin review and generated artifacts remain pending in the draft PR for #25.
  * fix(forms-contracts)!: regenerate the reviewed D08 artifacts
  Record the explicit approval of the six existing Forms P07 source pins. Preserve all other entry fields and regenerate from canonical sources. Disclose the collateral shared-register digest in Auth, Identity and Newsletter manifests; migration approvals and the resulting version-intent conflict remain pending in PR #26.
  * fix(contract-checks): distinguish shared P07 provenance from contract breaks
  Keep package-local reviews, schema/security changes, exact P07 pins and artifact integrity strict. Classify digest-only distributed manifest changes as patch; unchanged artifacts require no bump. Compare all packages against their published revisions, retain the Forms D08 minor requirement and leave its exact migration record pending review.
  * chore(contract-checks): record approved Forms migration"
  M	docs/forms-security-migration.md
  M	docs/openapi.md
  M	docs/releases.md
  A	docs/reviews/25-compatibility-report.json
  A	docs/reviews/25-forms-public-definition.md
  A	docs/reviews/25-migrations.draft.json
  A	docs/reviews/25-nx-preview.json
  A	docs/reviews/25-p07.draft.json
  M	generated/baseline-comparison.json
  M	generated/contract-manifest.json
  M	generated/openapi/aggregate-canonical.json
  M	generated/openapi/aggregate-canonical.yaml
  M	generated/openapi/aggregate-review.json
  M	generated/openapi/aggregate-review.yaml
  M	generated/openapi/inventory.json
  M	packages/auth/contract-manifest.json
  M	packages/forms/README.md
  M	packages/forms/compatibility/README.md
  M	packages/forms/contract-manifest.json
  M	packages/forms/openapi/forms-canonical.json
  M	packages/forms/openapi/forms-canonical.yaml
  M	packages/forms/openapi/forms-review.json
  M	packages/forms/openapi/forms-review.yaml
  M	packages/forms/openapi/inventory.json
  M	packages/forms/src/operations/index.ts
  M	packages/forms/test/forms.test.mjs
  M	packages/identity/contract-manifest.json
  M	packages/newsletter/contract-manifest.json
  M	tools/contract-authoring/forms-newsletter.test.mjs
  M	tools/contract-authoring/packed-consumer.mjs
  M	tools/openapi/compatibility.mjs
  A	tools/openapi/compatibility.test.mjs
  M	tools/openapi/migrations/forms.json
  M	tools/openapi/openapi.test.mjs
  M	tools/openapi/projection-proposal.json

### ❤️ Thank You

- Johan Vrolix @vrxj81

## 0.1.0 (2026-10-14)

### 🚀 Features

- ⚠️  add configurable Auth contracts and refresh reviewed provenance ([#24](https://github.com/anarchitects/anarchitecture-contracts/pull/24))

### ⚠️  Breaking Changes

- add configurable Auth contracts and refresh reviewed provenance  ([#24](https://github.com/anarchitects/anarchitecture-contracts/pull/24))
  published contract projection/source provenance is refreshed; old source/generator-pinned reviews cannot approve the new artifacts. Consumers must regenerate and review their exact configured evidence. The reviewed migration retains default HTTP semantics and immutable 0.0.1 releases. With zero-major adjustment, this disclosed artifact impact derives the approved 0.1.0 line for all four packages.
  * fix: recognize verified npm staging placeholders in release history"
  M	.prettierignore
  M	docs/nx-migration.md
  M	docs/openapi.md
  M	docs/releases.md
  A	docs/reviews/23-compatibility.draft.json
  A	docs/reviews/23-configurable-auth.md
  A	docs/reviews/23-migration-approval.md
  A	docs/reviews/23-migrations.draft.json
  A	docs/reviews/23-npm-staging-history.md
  A	docs/reviews/23-p07-approval.md
  A	docs/reviews/23-projections.draft.json
  M	generated/contract-manifest.json
  M	generated/openapi/aggregate-canonical.json
  M	generated/openapi/aggregate-canonical.yaml
  M	generated/openapi/aggregate-review.json
  M	generated/openapi/aggregate-review.yaml
  M	generated/openapi/inventory.json
  M	nx.json
  M	packages/auth/README.md
  M	packages/auth/compatibility/README.md
  M	packages/auth/contract-manifest.json
  M	packages/auth/openapi/auth-canonical.json
  M	packages/auth/openapi/auth-canonical.yaml
  M	packages/auth/openapi/auth-review.json
  M	packages/auth/openapi/auth-review.yaml
  M	packages/auth/openapi/inventory.json
  A	packages/auth/src/contracts.ts
  M	packages/auth/src/index.ts
  A	packages/auth/src/schemas/config.ts
  A	packages/auth/src/schemas/configurable.ts
  M	packages/auth/src/schemas/session.ts
  A	packages/auth/test/configurable.test.mjs
  M	packages/forms/compatibility/README.md
  M	packages/forms/contract-manifest.json
  M	packages/forms/openapi/forms-canonical.json
  M	packages/forms/openapi/forms-canonical.yaml
  M	packages/forms/openapi/forms-review.json
  M	packages/forms/openapi/forms-review.yaml
  M	packages/forms/openapi/inventory.json
  M	packages/identity/compatibility/README.md
  M	packages/identity/contract-manifest.json
  M	packages/identity/openapi/identity-canonical.json
  M	packages/identity/openapi/identity-canonical.yaml
  M	packages/identity/openapi/identity-review.json
  M	packages/identity/openapi/identity-review.yaml
  M	packages/identity/openapi/inventory.json
  M	packages/newsletter/compatibility/README.md
  M	packages/newsletter/contract-manifest.json
  M	packages/newsletter/openapi/inventory.json
  M	packages/newsletter/openapi/newsletter-canonical.json
  M	packages/newsletter/openapi/newsletter-canonical.yaml
  M	packages/newsletter/openapi/newsletter-review.json
  M	packages/newsletter/openapi/newsletter-review.yaml
  A	tools/contract-authoring/auth-profiles.test.mjs
  A	tools/contract-authoring/fixtures/auth-profile/README.md
  A	tools/contract-authoring/fixtures/auth-profile/auth-contract.config.ts
  A	tools/contract-authoring/fixtures/auth-profile/auth-contracts.factory.ts
  M	tools/contract-authoring/packed-consumer.mjs
  A	tools/openapi/auth-configuration.mjs
  A	tools/openapi/auth-configuration.test.mjs
  M	tools/openapi/cli.mjs
  M	tools/openapi/compatibility.mjs
  M	tools/openapi/generate.mjs
  M	tools/openapi/migrations/auth.json
  M	tools/openapi/migrations/forms.json
  M	tools/openapi/migrations/identity.json
  M	tools/openapi/migrations/newsletter.json
  M	tools/openapi/openapi.test.mjs
  M	tools/openapi/profiles.mjs
  M	tools/openapi/projection-proposal.json
  M	tools/openapi/projection-review.mjs
  M	tools/openapi/review-candidates.mjs
  M	tools/release/conventional.test.mjs
  M	tools/release/history.mjs
  M	tools/release/history.test.mjs
  A	tools/release/npm-staging-placeholders.json

### ❤️ Thank You

- Johan Vrolix @vrxj81

## 0.0.1 (2026-10-14)

### 🚀 Features

- adopt Nx workspace and split release/publish workflows ([#17](https://github.com/anarchitects/anarchitecture-contracts/pull/17))
- finalize OpenAPI profile resolution and release gates ([#16](https://github.com/anarchitects/anarchitecture-contracts/pull/16))
- generate OpenAPI review artifacts and compatibility gates ([#15](https://github.com/anarchitects/anarchitecture-contracts/pull/15))
- add canonical Forms and Newsletter HTTP contracts ([#14](https://github.com/anarchitects/anarchitecture-contracts/pull/14))

### init

- **auth-contracts:** decouple canonical publication from host conformance ([#21](https://github.com/anarchitects/anarchitecture-contracts/pull/21))
- **auth-contracts:** adopt ADR-0004 release governance across contracts ([#19](https://github.com/anarchitects/anarchitecture-contracts/pull/19))

### ❤️ Thank You

- Johan Vrolix @vrxj81