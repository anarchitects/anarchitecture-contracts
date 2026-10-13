import { z } from 'zod';

// JSON primitive conversions match the frozen Fastify boundary. No application
// validation, provider work or arbitrary JavaScript coercion belongs here.
// JSON.parse accepts exponents outside binary64 (1e309 -> Infinity). The legacy
// string coercer accepts those decoded values. Keep this narrow custom branch;
// native JSON Schema generation must fail rather than misdescribe its semantics.
const decodedNumber = z.union([
  z.number(),
  z.custom<number>((value) => value === Infinity || value === -Infinity),
]);
export const decodedJson: z.ZodType<z.infer<ReturnType<typeof z.json>>> =
  z.lazy(() =>
    z.union([
      z.string(),
      decodedNumber,
      z.boolean(),
      z.null(),
      z.array(decodedJson),
      z.record(z.string(), decodedJson),
    ]),
  );
const primitive = z.union([z.string(), decodedNumber, z.boolean(), z.null()]);
const scalar = z.union([primitive, z.tuple([primitive])]);
export const stringInput = <T extends z.ZodType<string, string>>(schema: T) =>
  scalar
    .transform((value) => {
      const item = Array.isArray(value) ? value[0] : value;
      return item === null ? '' : String(item);
    })
    .pipe(schema);

// JSON Schema minLength counts Unicode code points; JS/Zod .min counts UTF-16.
export const wireString = (min = 0, max?: number) =>
  z
    .string()
    .regex(new RegExp(`^(?:[\\s\\S]){${min},${max ?? ''}}(?![\\s\\S])`, 'u'));

export const integerInput = scalar
  .transform((value, context) => {
    const item = Array.isArray(value) ? value[0] : value;
    const number = item === null ? 0 : Number(item);
    if (item === '' || !Number.isFinite(number) || !Number.isInteger(number)) {
      context.addIssue({
        code: 'custom',
        message: 'Expected a coercible JSON integer',
      });
      return z.NEVER;
    }
    return number;
  })
  .pipe(z.number().multipleOf(1));

export const arrayInput = <T extends z.ZodType>(item: T) =>
  z.union([z.array(item), item.transform((value) => [value])]);
