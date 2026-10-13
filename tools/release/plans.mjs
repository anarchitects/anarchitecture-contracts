import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { invariant } from '../openapi/common.mjs';

export const releaseProjects = Object.freeze({
  'auth-contracts': '@anarchitects/auth-contracts',
  'forms-contracts': '@anarchitects/forms-contracts',
  'identity-contracts': '@anarchitects/identity-contracts',
  'newsletter-contracts': '@anarchitects/newsletter-contracts',
});

export function parsePlan(body, path) {
  const match = body.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  invariant(
    match && match[2].trim(),
    `Missing version plan or rationale: ${path}`,
  );
  const entries = YAML.parse(match[1]);
  invariant(
    entries && typeof entries === 'object' && !Array.isArray(entries),
    `Invalid version plan: ${path}`,
  );
  invariant(Object.keys(entries).length, `Empty version plan: ${path}`);
  for (const [project, bump] of Object.entries(entries)) {
    invariant(
      Object.hasOwn(releaseProjects, project),
      `Ineligible release project in ${path}: ${project}`,
    );
    invariant(
      ['patch', 'minor', 'major'].includes(bump),
      `Invalid bump in ${path}: ${bump}`,
    );
  }
  return { entries, rationale: match[2].trim() };
}

// A mechanical Changesets migration must not masquerade as new PR release
// intent. Compare against the old path as well when the base predates cutover.
export function migrateChangeset(body) {
  return body?.replace(
    /'@anarchitects\/(auth|forms|identity|newsletter)-contracts'/g,
    '$1-contracts',
  );
}

export function readReleasePlans({
  directory = '.nx/version-plans',
  previous = () => null,
} = {}) {
  const plan = {};
  const rank = { patch: 1, minor: 2, major: 3 };
  for (const file of readdirSync(directory)
    .filter((name) => name.endsWith('.md'))
    .sort()) {
    const path = join(directory, file);
    const body = readFileSync(path, 'utf8');
    const { entries } = parsePlan(body, path);
    if (
      previous(path) === body ||
      migrateChangeset(previous(`.changeset/${file}`)) === body
    )
      continue;
    for (const [project, bump] of Object.entries(entries)) {
      const name = releaseProjects[project];
      if (rank[bump] > (rank[plan[name]] ?? 0)) plan[name] = bump;
    }
  }
  return plan;
}
