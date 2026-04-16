import { z } from 'zod';

export const StartSessionInputSchema = z.object({
  agentScopeId: z.string().min(1),
  scenarioId: z.string().min(1),
  listingId: z.string().optional(),
});

export const GetStatusInputSchema = z.object({
  sessionId: z.string().min(1),
});

export const GetSettlementInputSchema = z.object({
  sessionId: z.string().min(1),
});

export type StartSessionInput = z.infer<typeof StartSessionInputSchema>;
export type GetStatusInput = z.infer<typeof GetStatusInputSchema>;
export type GetSettlementInput = z.infer<typeof GetSettlementInputSchema>;
