# @juny-klave/mcp

MCP server that gives Claude the ability to negotiate prices on your behalf — autonomously, privately, and with cryptographic proof of the outcome.

---

## What it does

KLAVE connects Claude to a bilateral negotiation engine. You describe what you want in plain English; Claude calls KLAVE, runs the negotiation through multiple rounds, and reports back with the settled price and a ZK proof reference. Your ceiling is cryptographically bound to the authorization token and never appears in any response — the seller never sees your budget.

---

## What You Can Negotiate

Anything with a price. KLAVE does not require pre-existing listings, platform partnerships, or pre-seeded scenarios. If it has an asking price and you have a ceiling, KLAVE can negotiate it.

**Freight and logistics**
> "Negotiate 200 FEU containers Shanghai to Rotterdam. They're asking $2,806. My ceiling is $2,700."

**Software and SaaS**
> "Get me a better price on this CRM license. 500 seats, they want $75,000 annually. I won't go above $58,000."

**Employment and contracts**
> "A contractor is asking $185/hour for a 6-month engagement. My budget is $150/hour. Negotiate it."

**Real estate**
> "Negotiate our office lease renewal. Landlord wants $42/sqft. We need to be at $35 or below."

**Legal and settlement**
> "Negotiate a settlement. The other party is asking $250,000. My ceiling is $180,000."

**Any bilateral negotiation**
> "They're asking [X]. I won't pay more than [Y]. Negotiate."

---

## Prerequisites

- Node.js 18+
- Claude Desktop or Claude Code
- A KLAVE API key — [get one at klavecommerce.com](https://klavecommerce.com/docs)

---

## Install in Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "klave": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://klave1-production.up.railway.app/mcp/sse",
        "--header",
        "x-api-key:YOUR_API_KEY"
      ]
    }
  }
}
```

Replace `YOUR_API_KEY` with your key from [klavecommerce.com](https://klavecommerce.com/docs).

---

## Install in Claude Code

```bash
claude mcp add klave \
  --transport sse \
  "https://klave1-production.up.railway.app/mcp/sse" \
  --header "x-api-key:YOUR_API_KEY"
```

---

## Run locally (stdio)

```bash
git clone https://github.com/juny-klave/klave-mcp.git
cd klave-mcp
npm install
npm run build
```

Then point Claude Desktop at the local build:

```json
{
  "mcpServers": {
    "klave": {
      "command": "node",
      "args": ["/absolute/path/to/klave-mcp/dist/index.js"],
      "env": {
        "KLAVE_API_URL": "https://klave1-production.up.railway.app",
        "KLAVE_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

---

## The 4 tools

| Tool | What it does |
|---|---|
| `klave_negotiate` | Start a negotiation — any subject, any industry, any price range |
| `klave_advance` | Advance one round — call in a loop until SETTLED or TERMINATED |
| `klave_status` | Get current state and full round history at any time |
| `klave_verify` | Get the ZK proof confirming the settlement was conducted fairly |

### Tool sequence

```
klave_negotiate        ← describe what you're negotiating and your ceiling
klave_advance (loop)   ← advance round by round until SETTLED
klave_status           ← check progress at any time
klave_verify           ← get cryptographic proof after settlement
```

---

## Privacy guarantees

- Your ceiling (`ceiling_price`) is passed to the negotiation engine and **never** appears in any tool response.
- The seller's floor price is derived server-side and **never** a field in any API response.
- `leaks_detected` in verify responses is sourced from the server — never hardcoded.
- Every negotiation generates an auditable ZK proof.

---

## Environment variables (local mode)

| Variable | Default | Description |
|---|---|---|
| `KLAVE_API_URL` | `https://klave1-production.up.railway.app` | KLAVE REST API base URL |
| `KLAVE_API_KEY` | *(empty)* | API key |
| `TRANSPORT` | `stdio` | `stdio` (Claude Desktop/Code) or `http` (remote/SSE) |
| `PORT` | `3002` | HTTP port when `TRANSPORT=http` |

---

## Getting an API key

Sign up at [klavecommerce.com/docs](https://klavecommerce.com).

---

## Developer SDK

If you're building an agent that needs to authorize negotiation programmatically, see the [KLAVE SDK](https://github.com/juny-klave/klave-sdk) (`@juny-klave/sdk`).

---

## License

MIT
