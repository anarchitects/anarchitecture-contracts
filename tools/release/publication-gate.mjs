import { pathToFileURL } from 'node:url';
import semver from 'semver';
import { invariant, readJson } from '../openapi/common.mjs';
import { releaseProjects } from './plans.mjs';

export function assertPublishable(project) {
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
    manifest.status === 'resolved' &&
      manifest.supportedCapabilities?.length > 0,
    `${project}: publication blocked: packaged OpenAPI is ${manifest.status}; approved host-runtime profiles and publication evidence are still required by #8`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  assertPublishable(process.argv[2]);
}
