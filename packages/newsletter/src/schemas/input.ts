import { z } from 'zod';

// Ignored webhook/honeypot fields retain decoded JSON values, including exponent
// overflow (1e309 -> Infinity). No coercion occurs in Newsletter requests.
// Keep overflow explicit so native conversion cannot misdescribe this boundary.
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

// TypeBox Value.Check counts UTF-16 units. Zod 4.5 and JSON Schema count code
// points, so the extra pure check is essential and remains a generation gate.
export const utf16String = (max: number) =>
  z
    .string()
    .max(max)
    .refine(
      (value) => value.length <= max,
      'String exceeds legacy UTF-16 length',
    );
