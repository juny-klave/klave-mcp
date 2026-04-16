# @klave/mcp

MCP server that gives Claude the ability to negotiate prices on your behalf — autonomously, privately, and with cryptographic proof of the outcome.

---

## What it does

KLAVE connects Claude to a bilateral negotiation engine. You describe what you want in plain English; Claude calls KLAVE, runs the negotiation through multiple rounds, and reports back with the settled price and a ZK proof reference. Your ceiling is cryptographically bound to the authorization token and never appears in any response — the seller never sees your budget.

**Example:**

> "Negotiate a rate for 200 FEU containers Shanghai to Rotterdam. My ceiling is $2,700."

Claude calls `klave_issue_scope` → `klave_start_session` → `klave_get_status` (loop) → `klave_get_settlement` and returns the settled price. Zero UI required.

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

## The 5 tools

| Tool | What it does |
|---|---|
| `klave_list_scenarios` | List available negotiation scenarios with opening positions |
| `klave_issue_scope` | Issue an AgentScope token that cryptographically binds your ceiling |
| `klave_start_session` | Start a negotiation session for a given scenario |
| `klave_get_status` | Advance one round and return current state — poll until SETTLED |
| `klave_get_settlement` | Retrieve the final settled price, ZK proof reference, and audit trail |

### Tool sequence

```
klave_list_scenarios       ← discover what can be negotiated
klave_issue_scope          ← bind your ceiling cryptographically
klave_start_session        ← start negotiation
klave_get_status (loop)    ← advance and poll until SETTLED or TERMINATED
klave_get_settlement       ← get the final result and proof
```

---

## Example prompts

```
"Negotiate a rate for 200 FEU containers Shanghai to Rotterdam. My ceiling is $2,700."

"I need to hire a contractor. They're asking $150/hour. I won't go above $120. Negotiate it."

"Get me a better price on this software license. The ask is $50,000 annually. My budget is $38,000."
```

---

## Privacy guarantees

- Your ceiling (`maxTransactionCents`) is cryptographically bound in the AgentScope token. It **never** appears in any tool response after `klave_issue_scope`.
- The seller's floor price is **never** a field in any API response.
- `leaksDetected` in status responses is sourced from the server — never hardcoded.

---

## Environment variables (local mode)

| Variable | Default | Description |
|---|---|---|
| `KLAVE_API_URL` | `https://klave1-production.up.railway.app` | KLAVE REST API base URL |
| `KLAVE_API_KEY` | *(empty)* | API key sent as `Authorization` and `x-api-key` headers |
| `TRANSPORT` | `stdio` | `stdio` (Claude Desktop/Code) or `http` (remote/SSE) |
| `PORT` | `3002` | HTTP port when `TRANSPORT=http` |

---

## Getting an API key

Sign up at [klavecommerce.com/docs](https://klavecommerce.com/docs) to get your API key and browse available negotiation listings.

---

## Agent authorization (AAP SDK)

If you're building an agent that needs to authorize negotiation programmatically, see the [KLAVE AAP SDK](https://github.com/juny-klave/klave-sdk) (`@klave/sdk`).

---

## License

MIT
