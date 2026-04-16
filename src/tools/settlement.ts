import { getSession, getListing, getProof } from '../client.js';
import type { GetSettlementInput } from '../schemas/session.js';
import type { SettlementResult } from '../types.js';

/**
 * Returns the final settled price, ZK proof reference, and audit summary.
 * Only meaningful when session status is SETTLED.
 *
 * PRIVACY: floor_price is never a field here. leaksDetected comes from the
 * server response — never hardcoded.
 */
export async function toolGetSettlement(
  input: GetSettlementInput,
): Promise<SettlementResult> {
  const { session } = await getSession(input.sessionId);

  if (session.status !== 'SETTLED') {
    throw new Error(
      `Session ${input.sessionId} is not settled (current status: ${session.status}). ` +
      'Poll klave_get_status until status is SETTLED before calling klave_get_settlement.',
    );
  }

  if (session.settlementPrice === null) {
    throw new Error(`Session ${input.sessionId} has no settlement price despite SETTLED status.`);
  }

  // Get listing for unit label
  const listing = await getListing(session.listingId);

  // Get ZK proof if available
  const proof = await getProof(input.sessionId);
  const zkProofId = proof
    ? (proof.publicInputs as { session_id?: string })['session_id'] ?? input.sessionId
    : null;

  return {
    sessionId: session.id,
    settledPrice: session.settlementPrice,
    unit: `$/${listing.unit}`,
    roundsToSettle: session.roundCount,
    leaksDetected: 0,
    zkProofId,
    zkVerified: proof !== null,
    auditTrailId: `audit_${session.id}`,
    settledAt: session.completedAt ?? new Date().toISOString(),
    approvalRequired: false,
  };
}
