import { pathToFileURL } from 'node:url';
import { invariant, readJson } from '../openapi/common.mjs';
import { releaseProjects } from './plans.mjs';

export function assertPublishable(project) {
  invariant(
    Object.hasOwn(releaseProjects, project),
    'Ineligible release project',
  );
  const domain = project.replace(/-contracts$/, '');
  const manifest = readJson(`packages/${domain}/contract-manifest.json`);
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
  // Scoped Nx publishing skips dependsOn: the preparation target itself must
  // fail closed, and deliberately cannot invoke npm under any circumstances.
  throw new Error(
    'Publication disabled until #8 delivers reviewed signed release and immutable-tag trusted-publishing workflows.',
  );
}
