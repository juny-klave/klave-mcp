// ---------------------------------------------------------------------------
// Scenario (derived from listing — MCP-facing view, no floor price)
// ---------------------------------------------------------------------------

export interface Scenario {
  id: string;
  tag: string;
  title: string;
  route: string;
  unit: string;
  /** Buyer opening offer = publicPrice × 0.85 (STANDARD_BUYER template) */
  buyerOpen: number;
  /** Seller opening ask = publicPrice */
  sellerOpen: number;
}

// ---------------------------------------------------------------------------
// AgentScope (issue response — ceiling never echoed)
// ---------------------------------------------------------------------------

export interface IssueScopeResult {
  agentScopeId: string;
  expiresAt: string;
  status: 'ACTIVE';
}

// ---------------------------------------------------------------------------
// Session start
// ---------------------------------------------------------------------------

export interface StartSessionResult {
  sessionId: string;
  status: 'INITIALIZING' | 'ACTIVE';
  estimatedRounds: number;
  startedAt: string;
}

// ---------------------------------------------------------------------------
// Session status (polling)
// ---------------------------------------------------------------------------

export type PublicSessionStatus = 'ACTIVE' | 'SETTLED' | 'TERMINATED' | 'PENDING_APPROVAL';

export interface RoundSummary {
  roundNumber: number;
  buyerOffer: number;
  sellerAsk: number;
  midpoint: number;
  clean: boolean;
}

export interface SessionStatusResult {
  sessionId: string;
  status: PublicSessionStatus;
  round: number;
  totalRounds: number;
  convergence: number;
  rounds: RoundSummary[];
  leaksDetected: number;
}

// ---------------------------------------------------------------------------
// Settlement
// ---------------------------------------------------------------------------

export interface SettlementResult {
  sessionId: string;
  settledPrice: number;
  unit: string;
  roundsToSettle: number;
  leaksDetected: number;
  zkProofId: string | null;
  zkVerified: boolean;
  auditTrailId: string;
  settledAt: string;
  approvalRequired: boolean;
}

// ---------------------------------------------------------------------------
// KLAVE REST API response shapes (used only inside client.ts)
// ---------------------------------------------------------------------------

export interface KlaveListingDto {
  id: string;
  tenantId: string;
  sellerId: string;
  title: string;
  unit: string;
  publicPrice: number;
  description: string;
  available: boolean;
  createdAt: string;
}

export interface KlaveAgentScopeDto {
  agentScopeId: string;
  agentId: string;
  buyerId: string;
  maxTransactionCents: number;
  maxWeeklyBudgetCents: number;
  permittedCategories: string[];
  expiresAt: string;
  issuedAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export interface KlaveInitiateSessionDto {
  sessionId: string;
  status: string;
  expiresAt: string;
}

export interface KlaveRoundDto {
  roundNumber: number;
  buyerOffer: number;
  sellerCounter: number;
  timestamp: string;
}

export interface KlaveSessionDto {
  id: string;
  buyerAgentId: string;
  sellerId: string;
  listingId: string;
  status: string;
  settlementPrice: number | null;
  roundCount: number;
  lastRoundAt: string | null;
  expiresAt: string | null;
  escrowId: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface KlaveSessionWithRoundsDto {
  session: KlaveSessionDto;
  rounds: KlaveRoundDto[];
}

export interface KlaveRoundResultDto {
  roundNumber: number;
  buyerOffer: number;
  sellerCounter: number;
  settled: boolean;
  settlementPrice: number | null;
  sessionStatus: string;
}

export interface KlaveProofDto {
  proof: unknown;
  publicInputs: {
    final_price: string;
    session_id: string;
    round_count: string;
    deal_cleared: string;
  };
}
