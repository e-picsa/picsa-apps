---
name: Supabase Interaction
description: Instructions for interacting with the local Supabase backend.
---

# Supabase Interaction Skill

This skill provides methods for AI agents to interact with the local Supabase backend.

**PRIMARY METHOD: Use the `supabase-db` MCP Server.**

The `supabase-db` MCP server is the most robust and reliable way to query the database, inspect schemas, and manage data. It connects directly to the PostgreSQL instance.

## 1. Setup & Verification

Before attempting other methods, ensure the `supabase-db` MCP server is configured and available.

### Step 1: Check `mcp_config.json`

Read the `mcp_config.json` file (usually in `.gemini/antigravity/` or similar agent configuration paths). Look for a `"supabase-db"` entry in the `"mcpServers"` object.

**If the configuration is MISSING, you MUST propose adding it.**

Add the following configuration to `mcp_config.json`:

```json
"supabase-db": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-postgres",
    "postgresql://postgres:postgres@localhost:54322/postgres" // Default local Supabase connection string
  ]
}
```

_Note: The port `54322` is the standard port for local Supabase Postgres. Verify this if connection fails._

### Step 2: Verify Connection

Use the `list_resources` or `run_command` tools (if available) to verify the server is running. A simple query test is the best verification:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 5;
```

If this works, **STOP HERE** and use this method for all database interactions.

## 2. Using `supabase-db` (Preferred)

Once configured, use the available tools from the `supabase-db` server:

- **`query`**: Run read-only SQL queries to fetch data.
  - _Example_: `SELECT * FROM user_roles;` or `SELECT * FROM storage.buckets;`
- **`execute`** (if available): Run DML statements (INSERT, UPDATE, DELETE) - _Use with caution_.
- **Schema Inspection**: Query `information_schema` directly.

**Advantages:**

- Direct SQL access is more powerful than the REST API.
- No need to manage API keys or tokens.
- Immediate feedback on schema structure.

## 3. Fallback Methods (If `supabase-db` is unavailable)

If the MCP server cannot be configured or fails to connect, use the legacy methods below.

### A. Check Supabase Status

To check if the local Supabase instance is running and get connection details:

```bash
npx nx run picsa-server:supabase -- status
```

Output contains API URL, DB URL, and service keys.

### B. Query Data via REST API

If direct DB access fails, use the Supabase REST API via a script.

1. Get the API URL and Service Role Key:

   ```bash
   npx nx run picsa-server:supabase -- status -o json > supabase_status.json
   ```

2. Generate a script to query the API (using `fetch` and the service key).

### C. Database Reset & Seed

If you need to reset the database to a clean state:

```bash
npx nx run picsa-server:reset
```

This command runs `db reset` and then seeds the database.

## Best Practices

- **Always Prefer MCP**: It is faster, safer, and cleaner than running ad-hoc scripts.
- **Read-Only First**: When exploring, stick to `SELECT` queries.
- **Check Status**: If queries fail, verify Docker containers are running (`docker ps`) or use the `status` command.
