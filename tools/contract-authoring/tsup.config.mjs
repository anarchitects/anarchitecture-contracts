import { basename, resolve } from 'node:path';

const names =
  basename(process.cwd()) === 'auth'
    ? ['index', 'schemas', 'operations', 'jwt', 'passkeys', 'policy']
    : ['index', 'schemas', 'operations'];
export default {
  entry: Object.fromEntries(
    names.map((name) => [
      name,
      `src/${['schemas', 'operations'].includes(name) ? `${name}/index` : name}.ts`,
    ]),
  ),
  tsconfig: resolve('../../tsconfig.json'),
  target: 'es2022',
  platform: 'neutral',
  dts: { compilerOptions: { ignoreDeprecations: '6.0' } },
  splitting: true,
  clean: true,
  external: ['zod'],
  silent: true,
};
