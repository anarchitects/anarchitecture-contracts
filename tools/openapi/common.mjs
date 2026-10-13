import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const domains = ['auth', 'forms', 'identity', 'newsletter'];
export const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
export function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sorted(value[key])]),
    );
  return value;
}
export const json = (value) => `${JSON.stringify(sorted(value), null, 2)}\n`;
export const digest = (value) =>
  createHash('sha256').update(value).digest('hex');
export function filesUnder(path) {
  return readdirSync(path, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
    .flatMap((entry) => {
      const file = join(path, entry.name);
      return entry.isDirectory() ? filesUnder(file) : [file];
    });
}
export function sourceFiles(domain) {
  return Object.fromEntries(
    [
      ...filesUnder(`packages/${domain}/src`),
      'tools/contract-authoring/operation-definition.ts',
    ]
      .sort()
      .map((file) => [file, digest(readFileSync(file))]),
  );
}
export function invariant(condition, message) {
  if (!condition) throw new Error(message);
}
