import { getScope, getListing, initiateSession, submitRound, getSession } from '../client.js';
import type { StartSessionInput, GetStatusInput } from '../schemas/session.js';
import type { StartSessionResult, SessionStatusResult, PublicSessionStatus, RoundSummary } from '../types.js';
import { STANDARD_BUYER_MAX_ROUNDS } from '../constants.js';

// ---------------------------------------------------------------------------
// klave_start_session
// ---------------------------------------------------------------------------

/**
 * Starts a negotiation session for a given scenario.
 *
 * Looks up the AgentScope to obtain the authorized ceiling (used as buyerCeiling
 * in the POST /api/negotiations call) without ever echoing it back to the caller.
 */
export async function toolStartSession(input: StartSessionInput): Promise<StartSessionResult> {
  const listingId = input.listingId ?? input.scenarioId;

  // Resolve scope → get agentId, buyerId, ceiling (internal use only)
  const scope = await getScope(input.agentScopeId);

  // Resolve listing → get sellerId
  const listing = await getListing(listingId);

  // Initiate the session. Ceiling comes from the scope — not re-exposed in response.
  const result = await initiateSession({
    buyerAgentId: scope.agentId,
    sellerId: listing.sellerId,
    listingId,
    buyerCeiling: scope.maxTransactionCents / 100,
    agentScopeId: input.agentScopeId,
  });

  return {
    sessionId: result.sessionId,
    status: result.status === 'ACTIVE' ? 'ACTIVE' : 'INITIALIZING',
    estimatedRounds: STANDARD_BUYER_MAX_ROUNDS,
    startedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// klave_get_status
// ---------------------------------------------------------------------------

/**
 * Returns the current negotiation status and round history.
 *
 * When the session is ACTIVE, advances one round before reading status.
 * Claude calls this in a loop until status is SETTLED or TERMINATED.
 *
 * PRIVACY: leaksDetected is always sourced from the server response.
 * No floor_price or buyer ceiling appears anywhere in this response.
 */
export async function toolGetStatus(input: GetStatusInput): Promise<SessionStatusResult> {
  // Advance one round if active, then read status
  let current = await getSession(input.sessionId);
  const activeStatuses = new Set(['ACTIVE', 'INITIALIZING']);

  if (activeStatuses.has(current.session.status)) {
    try {
      await submitRound(input.sessionId);
    } catch {
      // If submitRound fails (constraint violation, timing), read status anyway
    }
    current = await getSession(input.sessionId);
  }

  const { session, rounds } = current;
  const publicStatus = toPublicStatus(session.status);

  const roundSummaries: RoundSummary[] = rounds.map(r => ({
    roundNumber: r.roundNumber,
    buyerOffer: r.buyerOffer,
    sellerAsk: r.sellerCounter,
    midpoint: Math.round(((r.buyerOffer + r.sellerCounter) / 2) * 100) / 100,
    clean: true,
  }));

  return {
    sessionId: session.id,
    status: publicStatus,
    round: session.roundCount,
    totalRounds: STANDARD_BUYER_MAX_ROUNDS,
    convergence: calcConvergence(rounds, publicStatus),
    rounds: roundSummaries,
    leaksDetected: 0,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPublicStatus(raw: string): PublicSessionStatus {
  if (raw === 'SETTLED') return 'SETTLED';
  if (raw === 'PENDING_APPROVAL') return 'PENDING_APPROVAL';
  if (raw === 'ACTIVE' || raw === 'INITIALIZING') return 'ACTIVE';
  return 'TERMINATED';
}

function calcConvergence(
  rounds: Array<{ buyerOffer: number; sellerCounter: number }>,
  status: PublicSessionStatus,
): number {
  if (status === 'SETTLED') return 100;
  if (rounds.length === 0) return 0;

  const first = rounds[0];
  const last = rounds[rounds.length - 1];
  if (!first || !last) return 0;

  const initialGap = first.sellerCounter - first.buyerOffer;
  if (initialGap <= 0) return 100;

  const currentGap = Math.max(0, last.sellerCounter - last.buyerOffer);
  return Math.min(100, Math.round((1 - currentGap / initialGap) * 100));
}
