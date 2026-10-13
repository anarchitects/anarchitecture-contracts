import { z } from 'zod';
import { wireString } from './input.js';

// HTTP representation only. Rule meaning and evaluation remain in auth-ts.
export const PolicyRuleSchema = z.strictObject({
  action: wireString(1),
  subject: wireString(1),
  conditions: z.record(z.string(), z.json()).optional(),
  fields: z.array(wireString(1)).optional(),
  inverted: z.boolean().optional(),
  reason: wireString(1).optional(),
});
export const PolicyRuleArraySchema = z.array(PolicyRuleSchema);
export type PolicyRule = z.infer<typeof PolicyRuleSchema>;
export type PolicyRuleArray = z.infer<typeof PolicyRuleArraySchema>;
