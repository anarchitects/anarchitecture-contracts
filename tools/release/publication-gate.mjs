import { assertInitialVersion, distributionHistory } from './history.mjs';
import { pathToFileURL } from 'node:url';
import semver from 'semver';
import { existsSync, readFileSync } from 'node:fs';
import { invariant, json, readJson } from '../openapi/common.mjs';
import { canonicalArtifacts } from '../openapi/artifacts.mjs';
import { loadDomains } from '../openapi/model.mjs';
import { releaseProjects } from './projects.mjs';

// Gate A: validate source-derived canonical artifacts, never infer eligibility
// from a hand-edited status. Build/type/behavior/packed checks and compatibility
// are scheduled by Nx and release/publish before this integrity gate.
export async function assertPublishable(project) {
  invariant(
    Object.hasOwn(releaseProjects, project),
    'Ineligible release project',
  );
  const domain = project.replace(/-contracts$/, '');
  const pkg = readJson(`packages/${domain}/package.json`);
  if (process.env.RELEASE_VERSION) {
    invariant(
      semver.valid(process.env.RELEASE_VERSION) ===
        process.env.RELEASE_VERSION &&
        pkg.version === process.env.RELEASE_VERSION,
      'Release tag must match the exact package SemVer',
    );
  }
  const manifest = readJson(`packages/${domain}/contract-manifest.json`);
  invariant(
    manifest.packages?.[pkg.name] === pkg.version,
    'Regenerate contract artifacts after changing the package version',
  );
  invariant(
    manifest.formatVersion === 2 &&
      manifest.artifactKind === 'canonical-contract' &&
      manifest.status === 'canonical' &&
      manifest.contractPublication?.status === 'validated' &&
      manifest.implementationConformance?.status === 'unverified' &&
      manifest.deploymentCompliance?.status === 'unverified' &&
      manifest.supportedCapabilities?.length === 0 &&
      manifest.provenance === null,
    `${project}: publication requires canonical artifacts with no host-support claim`,
  );
  const models = (await loadDomains()).filter(
    (model) => model.domain === domain,
  );
  const result = await canonicalArtifacts(
    models,
    readJson('tools/openapi/projection-proposal.json'),
  );
  assertCanonicalBytes(project, result, manifest, (name) =>
    readFileSync(`packages/${domain}/openapi/${name}`, 'utf8'),
  );
  for (const name of result.artifacts.keys())
    invariant(
      pkg.exports[`./openapi/${name}`] === `./openapi/${name}`,
      `${project}: missing artifact export ${name}`,
    );
  invariant(
    pkg.exports['./manifest.json'] === './contract-manifest.json',
    `${project}: missing manifest export`,
  );
  const targets = (value) =>
    typeof value === 'string' ? [value] : Object.values(value).flatMap(targets);
  for (const target of targets(pkg.exports))
    invariant(
      target.startsWith('./') &&
        !target.includes('../') &&
        existsSync(`packages/${domain}/${target}`),
      `${project}: missing or invalid export ${target}`,
    );
  return result.manifest;
}

export function assertCanonicalBytes(
  project,
  expected,
  manifest,
  readArtifact,
) {
  invariant(
    json(manifest) === json(expected.manifest),
    `${project}: canonical manifest drift; regenerate and review`,
  );
  for (const [name, bytes] of expected.artifacts)
    invariant(
      readArtifact(name) === bytes,
      `${project}: canonical artifact drift: ${name}`,
    );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const project = process.argv[2];
  await assertPublishable(project);
  const history = await distributionHistory();
  assertInitialVersion(project, process.env.RELEASE_VERSION, history, {
    publishing: true,
  });
}
