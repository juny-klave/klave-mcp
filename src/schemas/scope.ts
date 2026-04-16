import { z } from 'zod';

export const IssueScopeInputSchema = z.object({
  buyerPrincipalId: z.string().min(1),
  maxTransactionCents: z.number().int().positive(),
  weeklyBudgetCents: z.number().int().positive(),
  permittedCategories: z.array(z.string()).default([]),
  expiresInHours: z.number().int().positive().default(24),
});

export type IssueScopeInput = z.infer<typeof IssueScopeInputSchema>;
