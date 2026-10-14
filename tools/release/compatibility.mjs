import { checkReleaseVersions } from '../openapi/compatibility.mjs';
import { releaseProjects } from './projects.mjs';
import { compatibilityVersions } from './versions.mjs';

// Nx-specific version resolution stays outside the independent contract checker.
export async function checkCompatibility(
  models,
  baseRef,
  proposal,
  { cumulative = false } = {},
) {
  const { versions, history } = proposal ?? (await compatibilityVersions());
  const unreleased = Object.keys(releaseProjects)
    .filter((p) => !history[p].length)
    .map((p) => releaseProjects[p]);
  const options = { versions, unreleased };
  const reports = checkReleaseVersions(models, baseRef, options);
  // Also assess the cumulative public delta since each last release. A small PR
  // must not hide a larger earlier change behind the same pending version bump.
  for (const model of cumulative ? models : []) {
    const project = `${model.domain}-contracts`;
    const previous = history[project][0];
    if (previous)
      checkReleaseVersions([model], `${project}@${previous}`, options);
  }
  return reports;
}
