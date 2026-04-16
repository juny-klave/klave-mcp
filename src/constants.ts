export const KLAVE_API_URL = process.env['KLAVE_API_URL'] ?? 'http://localhost:3001';
export const KLAVE_API_KEY = process.env['KLAVE_API_KEY'] ?? '';
export const TRANSPORT = process.env['TRANSPORT'] ?? 'stdio';
export const HTTP_PORT = parseInt(process.env['PORT'] ?? '3002', 10);
export const REQUEST_TIMEOUT_MS = 30_000;

/** STANDARD_BUYER template max rounds (T=12). Used for estimatedRounds and convergence. */
export const STANDARD_BUYER_MAX_ROUNDS = 12;

/** MCP server name and version, reported in the protocol handshake. */
export const SERVER_NAME = 'klave-negotiation';
export const SERVER_VERSION = '1.0.0';
