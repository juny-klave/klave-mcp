import { issueScope } from '../client.js';
import type { IssueScopeInput } from '../schemas/scope.js';
import type { IssueScopeResult } from '../types.js';

/**
 * Issues an AgentScope token authorizing Claude to negotiate within defined bounds.
 *
 * PRIVACY: maxTransactionCents goes into the token and is NEVER echoed back.
 * Only agentScopeId, expiresAt, and status are returned.
 */
export async function toolIssueScope(input: IssueScopeInput): Promise<IssueScopeResult> {
  const validForDays = Math.ceil(input.expiresInHours / 24);

  // The demo uses a fixed agent ID (agent_001) for the buyer principal.
  // In production the agentId would be derived from the authenticated session.
  const agentId = `agent_${input.buyerPrincipalId}`;
  const buyerId = input.buyerPrincipalId;

  const token = await issueScope({
    agentId,
    buyerId,
    maxTransactionCents: input.maxTransactionCents,
    maxWeeklyBudgetCents: input.weeklyBudgetCents,
    permittedCategories: input.permittedCategories,
    validForDays,
  });

  // maxTransactionCents and all other private values are deliberately excluded.
  return {
    agentScopeId: token.agentScopeId,
    expiresAt: token.expiresAt,
    status: 'ACTIVE',
  };
}
