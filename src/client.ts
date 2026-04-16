import axios, { AxiosError, type AxiosInstance } from 'axios';
import { KLAVE_API_URL, KLAVE_API_KEY, REQUEST_TIMEOUT_MS } from './constants.js';
import type {
  KlaveListingDto,
  KlaveAgentScopeDto,
  KlaveInitiateSessionDto,
  KlaveSessionWithRoundsDto,
  KlaveRoundResultDto,
  KlaveProofDto,
} from './types.js';

function makeErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const status = err.response?.status;
    const detail = (err.response?.data as { error?: string } | undefined)?.error;
    switch (status) {
      case 401:
        return 'KLAVE API key invalid or missing. Set KLAVE_API_KEY environment variable.';
      case 403:
        return 'AgentScope token does not permit this operation.';
      case 404:
        return 'Session or listing not found. Verify the ID is correct.';
      case 409:
        return 'Session already exists for this listing.';
      case 422:
        return `Negotiation parameters invalid: ${detail ?? 'check your inputs'}`;
      case 429:
        return 'Rate limit reached. Wait before starting another session.';
      case 500:
        return 'KLAVE server error. Check server logs.';
      default:
        return detail ?? err.message;
    }
  }
  return err instanceof Error ? err.message : String(err);
}

function createHttpClient(): AxiosInstance {
  return axios.create({
    baseURL: KLAVE_API_URL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KLAVE_API_KEY}`,
      'x-api-key': KLAVE_API_KEY,
    },
  });
}

let _client: AxiosInstance | null = null;

function client(): AxiosInstance {
  if (!_client) _client = createHttpClient();
  return _client;
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export async function getListings(): Promise<KlaveListingDto[]> {
  try {
    const res = await client().get<KlaveListingDto[]>('/api/listings');
    return res.data;
  } catch (err) {
    throw new Error(makeErrorMessage(err));
  }
}

export async function getListing(listingId: string): Promise<KlaveListingDto> {
  try {
    const res = await client().get<KlaveListingDto>(`/api/listings/${listingId}`);
    return res.data;
  } catch (err) {
    throw new Error(makeErrorMessage(err));
  }
}

// ---------------------------------------------------------------------------
// AgentScope
// ---------------------------------------------------------------------------

export interface IssueScopeParams {
  agentId: string;
  buyerId: string;
  maxTransactionCents: number;
  maxWeeklyBudgetCents: number;
  permittedCategories: string[];
  validForDays: number;
}

export async function issueScope(params: IssueScopeParams): Promise<KlaveAgentScopeDto> {
  try {
    const res = await client().post<KlaveAgentScopeDto>('/api/agent-scopes', params);
    return res.data;
  } catch (err) {
    throw new Error(makeErrorMessage(err));
  }
}

export async function getScope(agentScopeId: string): Promise<KlaveAgentScopeDto> {
  try {
    const res = await client().get<KlaveAgentScopeDto>(`/api/agent-scopes/${agentScopeId}`);
    return res.data;
  } catch (err) {
    throw new Error(makeErrorMessage(err));
  }
}

// ---------------------------------------------------------------------------
// Negotiations
// ---------------------------------------------------------------------------

export interface InitiateSessionParams {
  buyerAgentId: string;
  sellerId: string;
  listingId: string;
  buyerCeiling: number;
  agentScopeId?: string;
}

export async function initiateSession(
  params: InitiateSessionParams,
): Promise<KlaveInitiateSessionDto> {
  try {
    const res = await client().post<KlaveInitiateSessionDto>('/api/negotiations', params);
    return res.data;
  } catch (err) {
    throw new Error(makeErrorMessage(err));
  }
}

export async function submitRound(sessionId: string): Promise<KlaveRoundResultDto> {
  try {
    const res = await client().post<KlaveRoundResultDto>(
      `/api/negotiations/${sessionId}/rounds`,
      {},
    );
    return res.data;
  } catch (err) {
    throw new Error(makeErrorMessage(err));
  }
}

export async function getSession(sessionId: string): Promise<KlaveSessionWithRoundsDto> {
  try {
    const res = await client().get<KlaveSessionWithRoundsDto>(
      `/api/negotiations/${sessionId}`,
    );
    return res.data;
  } catch (err) {
    throw new Error(makeErrorMessage(err));
  }
}

export async function getProof(sessionId: string): Promise<KlaveProofDto | null> {
  try {
    const res = await client().get<KlaveProofDto>(`/api/negotiations/${sessionId}/proof`);
    return res.data;
  } catch (err) {
    if (err instanceof AxiosError && (err.response?.status === 404 || err.response?.status === 501)) {
      return null;
    }
    throw new Error(makeErrorMessage(err));
  }
}
