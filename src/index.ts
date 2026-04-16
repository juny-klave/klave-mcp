import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from 'http';
import { z } from 'zod';
import { SERVER_NAME, SERVER_VERSION, TRANSPORT, HTTP_PORT } from './constants.js';
import { listScenarios } from './tools/scenarios.js';
import { toolIssueScope } from './tools/scope.js';
import { toolStartSession, toolGetStatus } from './tools/session.js';
import { toolGetSettlement } from './tools/settlement.js';
import { IssueScopeInputSchema } from './schemas/scope.js';
import { StartSessionInputSchema, GetStatusInputSchema, GetSettlementInputSchema } from './schemas/session.js';

// ---------------------------------------------------------------------------
// Server init
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION,
});

// ---------------------------------------------------------------------------
// Tool: klave_list_scenarios
// ---------------------------------------------------------------------------

server.tool(
  'klave_list_scenarios',
  'List available negotiation scenarios with commodity, route, unit, and opening position ranges.',
  {},
  async () => {
    const scenarios = await listScenarios();
    return { content: [{ type: 'text', text: JSON.stringify({ scenarios }, null, 2) }] };
  },
);

// ---------------------------------------------------------------------------
// Tool: klave_issue_scope
// ---------------------------------------------------------------------------

server.tool(
  'klave_issue_scope',
  'Issue an AgentScope token authorizing Claude to negotiate within defined bounds. ' +
  'The ceiling (maxTransactionCents) is cryptographically bound to the token and ' +
  'never appears in any subsequent tool response.',
  {
    buyerPrincipalId: z.string().describe('User identifier for the buyer'),
    maxTransactionCents: z.number().int().positive().describe('Ceiling in cents (integer, required)'),
    weeklyBudgetCents: z.number().int().positive().describe('Weekly cap in cents (integer, required)'),
    permittedCategories: z.array(z.string()).default([]).describe('Permitted categories, e.g. ["OCEAN_FREIGHT"]. Empty = all.'),
    expiresInHours: z.number().int().positive().default(24).describe('Token validity in hours'),
  },
  async (args) => {
    const input = IssueScopeInputSchema.parse(args);
    const result = await toolIssueScope(input);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  },
);

// ---------------------------------------------------------------------------
// Tool: klave_start_session
// ---------------------------------------------------------------------------

server.tool(
  'klave_start_session',
  'Start a negotiation session for a given scenario using an existing AgentScope token. ' +
  'Returns a sessionId. Poll klave_get_status until status is SETTLED or TERMINATED.',
  {
    agentScopeId: z.string().describe('AgentScope token ID from klave_issue_scope'),
    scenarioId: z.string().describe('Scenario/listing ID from klave_list_scenarios'),
    listingId: z.string().optional().describe('Optional explicit listing ID if different from scenarioId'),
  },
  async (args) => {
    const input = StartSessionInputSchema.parse(args);
    const result = await toolStartSession(input);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  },
);

// ---------------------------------------------------------------------------
// Tool: klave_get_status
// ---------------------------------------------------------------------------

server.tool(
  'klave_get_status',
  'Get the current negotiation status and round history. ' +
  'When the session is ACTIVE, advances one round then returns updated state. ' +
  'Call in a loop until status is SETTLED or TERMINATED. ' +
  'No floor price or buyer ceiling appears in the response.',
  {
    sessionId: z.string().describe('Negotiation session ID from klave_start_session'),
  },
  async (args) => {
    const input = GetStatusInputSchema.parse(args);
    const result = await toolGetStatus(input);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  },
);

// ---------------------------------------------------------------------------
// Tool: klave_get_settlement
// ---------------------------------------------------------------------------

server.tool(
  'klave_get_settlement',
  'Get the final settled price, ZK proof reference, and audit trail. ' +
  'Only call when klave_get_status returns status SETTLED.',
  {
    sessionId: z.string().describe('Settled session ID'),
  },
  async (args) => {
    const input = GetSettlementInputSchema.parse(args);
    const result = await toolGetSettlement(input);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  },
);

// ---------------------------------------------------------------------------
// Transport selection and start
// ---------------------------------------------------------------------------

async function start(): Promise<void> {
  if (TRANSPORT === 'http') {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const httpServer = createServer(async (req, res) => {
      await transport.handleRequest(req, res);
    });
    await server.connect(transport);
    httpServer.listen(HTTP_PORT, () => {
      process.stderr.write(
        `klave-mcp-server listening on http://localhost:${HTTP_PORT} (HTTP transport)\n`,
      );
    });
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    process.stderr.write('klave-mcp-server started (stdio transport)\n');
  }
}

start().catch((err: unknown) => {
  process.stderr.write(`klave-mcp-server fatal: ${String(err)}\n`);
  process.exit(1);
});
