import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import semver from 'semver';
import YAML from 'yaml';
import { digest, json, invariant, readJson } from './common.mjs';

export function compareLegacy(models, baseline, legacyDocument, inventories) {
  const operations = models.flatMap((model) => model.operations);
  const newIds = {
    'POST /auth/jwt/login': 'loginWithJwt',
    'POST /auth/jwt/logout': 'logoutWithJwt',
    'POST /auth/jwt/refresh': 'refreshJwtTokens',
  };
  invariant(
    operations.length === baseline.length,
    'Legacy route count changed; a reviewed migration is required',
  );
  return baseline
    .map((route) => {
      const operation = operations.find(
        (op) => `${op.method} ${op.path}` === route.key,
      );
      invariant(operation, `Removed legacy route: ${route.key}`);
      invariant(
        operation.operationId === (route.operationId ?? newIds[route.key]),
        `Changed legacy operationId: ${route.key}`,
      );
      invariant(
        operation.responses[String(route.successStatus)]?.outcome === 'success',
        `Changed legacy success status: ${route.key}`,
      );
      invariant(
        json(operation.tags) ===
          json([operation.domain[0].toUpperCase() + operation.domain.slice(1)]),
        `Changed legacy tags: ${route.key}`,
      );
      const legacy =
        legacyDocument.paths[operation.path]?.[operation.method.toLowerCase()];
      invariant(
        legacy || operation.compatibility.discrepancies.includes('D01'),
        `Unclassified missing baseline operation: ${route.key}`,
      );
      const current = inventories
        .flatMap((inventory) => inventory.operations)
        .find(
          (entry) => entry.definition.operationId === operation.operationId,
        );
      return {
        operationId: operation.operationId,
        route: route.key,
        baselineOperationId: route.operationId ?? null,
        disposition: legacy
          ? 'semantic-extraction-evidence-required'
          : 'D01-document-existing-JWT-route',
        discrepancies: operation.compatibility.discrepancies,
        fixtures: operation.compatibility.fixtures,
        baselineSchemaDigest: digest(json(route.schema)),
        canonicalDefinitionDigest: digest(json(current)),
        baselineOpenApiDigest: legacy ? digest(json(legacy)) : null,
        status: 'review-only',
        evidence: `packages/${operation.domain}/compatibility/README.md`,
      };
    })
    .sort((a, b) => a.route.localeCompare(b.route, 'en'));
}

// Conservative on purpose: arbitrary JSON Schema language inclusion and Zod
// behavior cannot be proved by a structural diff. Both widening and narrowing
// are breaking by default, including negative/security guarantees.
export function diffContracts(before, after) {
  const findings = [];
  const add = (impact, surface, detail) =>
    findings.push({ impact, surface, detail });
  const prior = new Map(
    before.inventory.operations.map((op) => [op.definition.operationId, op]),
  );
  const next = new Map(
    after.inventory.operations.map((op) => [op.definition.operationId, op]),
  );
  for (const [id, old] of prior) {
    const current = next.get(id);
    if (!current) {
      add('breaking', id, 'Operation removed or renamed');
      continue;
    }
    const stripProse = (op) => {
      const copy = structuredClone(op);
      delete copy.definition.summary;
      delete copy.definition.description;
      return copy;
    };
    if (json(stripProse(old)) !== json(stripProse(current)))
      add(
        'breaking',
        id,
        'Request/response, route, tags, status, headers, security, availability or semantics changed; assess both directions',
      );
    else if (json(old) !== json(current))
      add('patch', id, 'Operation prose changed');
  }
  for (const id of next.keys())
    if (!prior.has(id))
      add(
        'minor',
        id,
        'Operation added; older implementation capability remains explicit',
      );
  const a = before.inventory.schemas,
    b = after.inventory.schemas;
  for (const name of Object.keys(a)) {
    if (!Object.hasOwn(b, name)) add('breaking', name, 'Schema ID removed');
    else if (json(a[name]) !== json(b[name]))
      add(
        'breaking',
        name,
        'Schema constraints or projection changed; acceptance in both directions needs review',
      );
  }
  for (const name of Object.keys(b))
    if (!Object.hasOwn(a, name)) add('minor', name, 'Schema ID added');
  for (const key of [
    'profile',
    'releaseBlockers',
    'capabilityBlockers',
    'projectionReviews',
    'projectionProposal',
    'provenance',
    'supportedCapabilities',
    'status',
    'unresolvedHostBindings',
    'excludedOperations',
  ])
    if (json(before.manifest[key]) !== json(after.manifest[key]))
      add(
        'breaking',
        key,
        'Profile, capability or security obligations changed',
      );
  return findings;
}

export function requiredBump(version, findings) {
  invariant(semver.valid(version), `Invalid package version: ${version}`);
  if (findings.some((finding) => finding.impact === 'breaking'))
    return semver.major(version) === 0 ? 'minor' : 'major';
  if (findings.some((finding) => finding.impact === 'minor')) return 'minor';
  return findings.length ? 'patch' : null;
}

export function validateReleasePlan({
  name,
  version,
  nextVersion,
  findings,
  plan,
  migration,
  baseRevision,
}) {
  const bump = requiredBump(version, findings);
  if (!bump) return;
  const rank = { patch: 1, minor: 2, major: 3 };
  const versioned =
    semver.valid(nextVersion) &&
    semver.gt(nextVersion, version) &&
    semver.gte(
      `${semver.major(nextVersion)}.${semver.minor(nextVersion)}.${semver.patch(nextVersion)}`,
      semver.inc(version, bump),
    );
  invariant(
    versioned || rank[plan[name]] >= rank[bump],
    `${name} requires a ${bump} release entry`,
  );
  if (findings.some((finding) => finding.impact === 'breaking')) {
    invariant(
      migration?.status === 'approved' &&
        migration.package === name &&
        migration.baseRevision === baseRevision &&
        migration.findingsDigest === digest(json(findings)) &&
        migration.decision &&
        migration.owner &&
        migration.consumerMigration &&
        migration.rollback,
      `${name}: breaking changes require a matching reviewed migration, including pre-1.0`,
    );
  }
}

export function gitFile(ref, file) {
  try {
    return execFileSync('git', ['show', `${ref}:${file}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    return null;
  }
}
export function releaseReports(models, baseRef) {
  const revision = execFileSync(
    'git',
    ['rev-parse', '--verify', `${baseRef}^{commit}`],
    { encoding: 'utf8' },
  ).trim();
  const plan = {};
  for (const name of readdirSync('.changeset').filter(
    (file) => file.endsWith('.md') && file !== 'README.md',
  )) {
    const path = `.changeset/${name}`,
      body = readFileSync(path, 'utf8');
    if (gitFile(revision, path) === body) continue;
    const frontmatter = body.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    invariant(frontmatter, `Missing Changeset frontmatter: ${path}`);
    for (const [pkg, bump] of Object.entries(YAML.parse(frontmatter[1]))) {
      invariant(
        ['patch', 'minor', 'major'].includes(bump),
        `Invalid bump in ${path}`,
      );
      if (
        { patch: 1, minor: 2, major: 3 }[bump] >
        ({ patch: 1, minor: 2, major: 3 }[plan[pkg]] ?? 0)
      )
        plan[pkg] = bump;
    }
  }
  const reports = [];
  for (const model of models) {
    const basePackageText = gitFile(
      revision,
      `packages/${model.domain}/package.json`,
    );
    if (!basePackageText) continue;
    const previousPackage = JSON.parse(basePackageText);
    const inventoryPath = `packages/${model.domain}/openapi/inventory.json`;
    const manifestPath = `packages/${model.domain}/contract-manifest.json`;
    const oldInventory = gitFile(revision, inventoryPath),
      oldManifest = gitFile(revision, manifestPath);
    const after = {
      inventory: readJson(inventoryPath),
      manifest: readJson(manifestPath),
    };
    const findings =
      oldInventory && oldManifest
        ? diffContracts(
            {
              inventory: JSON.parse(oldInventory),
              manifest: JSON.parse(oldManifest),
            },
            after,
          )
        : [
            {
              impact: 'minor',
              surface: 'openapi',
              detail:
                'First generated artifacts and explicit exports; projection and profile review gates remain',
            },
          ];
    if (oldManifest) {
      const previous = JSON.parse(oldManifest);
      if (
        json(previous.artifacts) !== json(after.manifest.artifacts) ||
        json(previous.generator) !== json(after.manifest.generator) ||
        json(previous.tools) !== json(after.manifest.tools)
      )
        findings.push({
          impact: 'patch',
          surface: 'generated-artifacts',
          detail: 'Generated artifacts or pinned generator changed',
        });
    }
    for (const file of ['README.md', 'LICENSE']) {
      const path = `packages/${model.domain}/${file}`;
      if (gitFile(revision, path) !== readFileSync(path, 'utf8'))
        findings.push({
          impact: 'patch',
          surface: file,
          detail: 'Published package documentation changed',
        });
    }
    for (const [path, hash] of Object.entries(model.sourceFiles)) {
      const previous = gitFile(revision, path);
      if (previous === null || digest(previous) !== hash)
        findings.push({
          impact: 'breaking',
          surface: path,
          detail:
            'Canonical parser/type/operation source changed; generated shape alone cannot prove behavioral compatibility',
        });
    }
    // Also detect deleted source files, which do not appear in the current graph.
    const previousPaths = execFileSync(
      'git',
      [
        'ls-tree',
        '-r',
        '--name-only',
        revision,
        `packages/${model.domain}/src`,
      ],
      { encoding: 'utf8' },
    )
      .trim()
      .split('\n')
      .filter(Boolean);
    for (const path of previousPaths)
      if (!Object.hasOwn(model.sourceFiles, path))
        findings.push({
          impact: 'breaking',
          surface: path,
          detail: 'Canonical source/export removed',
        });
    for (const key of [
      'exports',
      'dependencies',
      'peerDependencies',
      'engines',
      'type',
      'main',
      'types',
    ]) {
      if (json(previousPackage[key]) === json(model.package[key])) continue;
      const additiveExports =
        key === 'exports' &&
        Object.entries(previousPackage.exports).every(
          ([name, value]) => json(model.package.exports[name]) === json(value),
        );
      findings.push({
        impact: additiveExports ? 'minor' : 'breaking',
        surface: key,
        detail: 'Package consumption surface changed',
      });
    }
    const migrationPath = `tools/openapi/migrations/${model.domain}.json`;
    const review = {
      name: model.package.name,
      version: previousPackage.version,
      nextVersion: model.package.version,
      findings,
      plan,
      baseRevision: revision,
      migration: existsSync(migrationPath) ? readJson(migrationPath) : null,
    };
    reports.push({
      package: model.package.name,
      requiredBump: requiredBump(previousPackage.version, findings),
      review,
      findings,
    });
  }
  return reports;
}

export function checkReleasePlans(models, baseRef) {
  return releaseReports(models, baseRef).map(({ review, ...report }) => {
    validateReleasePlan(review);
    return report;
  });
}
