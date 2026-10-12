# PICSA Server

See docs at: https://docs.picsa.app/server/setup

## Database Seeding & Remote Mirroring

### 1. Base Local Seed (`db:seed`)

Resets the local database to a clean migration baseline and seeds baseline records from local CSVs (`supabase/data/*_rows.csv`):

```bash
yarn nx run picsa-server:db:seed
```

### 2. Extended Remote Mirror (`db:seed:extended`)

Resets the local database and seeds directly with complete, unfiltered data from the remote Supabase database (without writing CSV files):

```bash
yarn nx run picsa-server:db:seed:extended
```

### 3. Seed data export (`db:seed:export`)

Pulls filtered seed tables from the remote database into local CSVs (`supabase/data/*_rows.csv`).

```bash
yarn nx run picsa-server:db:seed:export
```

### Prerequisites for Remote Operations

1. **Credentials** — copy the template and fill in real values (file is gitignored):

   ```bash
   cp apps/picsa-server/.env.server.example apps/picsa-server/.env.server
   ```

   Use the **secret key** (`sb_secret_...`). The publishable key is RLS-blocked on
   most seed tables, and `budget.budgets` plus `geo.countries`/`geo.locales` are
   secret-only. The script is one-way pull only (SELECT queries + local writes, no remote writes), so the privileged key is safe to use here.

2. **Exposed schemas on remote** — PostgREST only serves schemas listed in the
   project's Data API settings. Ensure the remote exposes the same schemas as
   local `supabase/config.toml` (`schemas = ["public", "storage", "graphql_public", "geo", "budget"]`):
   - Open `https://supabase.com/dashboard/project/{project_id}/integrations/data_api/settings`
   - Under exposed schemas, add `geo` and `budget` if missing.
   - Missing schemas fail with `Invalid schema: <name>` during export.

### Behaviour notes

- Base seed config (`scripts/db-seed/db-seed.config.ts`) defines table priorities, orderings, and column mappings.
- `SEED_DATA_CONFIG` applies representative filters (e.g. `SEED_STATION_IDS`) for committing minimal CSVs.
- `SEED_DATA_EXTENDED_CONFIG` does not filter, pulling complete datasets for detailed local development.
- `created_at` / `updated_at` are stripped from every export (DB defaults repopulate on import). Tables sort by `id` for stable diffs — override via `orderBy` in config where no `id` column exists (e.g. geo tables).
- TypeScript types (`gen-types`) are generated from the local docker DB, not the remote — run `yarn nx run picsa-server:gen-types` after a local migration or reset/seed instead.
