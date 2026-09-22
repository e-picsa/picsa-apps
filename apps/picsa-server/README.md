# PICSA Server

See docs at: https://docs.picsa.app/server/setup

## Seed data export (`seed-export`)

Pulls seed tables from the remote database into local CSVs (`supabase/data/*_rows.csv`).

```bash
yarn nx run picsa-server:seed-export
```

### Prerequisites

1. **Credentials** — copy the template and fill in real values (file is gitignored):
   ```bash
   cp apps/picsa-server/.env.server.example apps/picsa-server/.env.server
   ```
   Use the **secret key** (`sb_secret_...`). The publishable key is RLS-blocked on
   most seed tables, and `budget.budgets` plus `geo.countries`/`geo.locales` are
   secret-only. The script is one-way pull only (SELECT queries + local CSV
   writes, no remote writes), so the privileged key is safe to use here.

2. **Exposed schemas on remote** — PostgREST only serves schemas listed in the
   project's Data API settings. Ensure the remote exposes the same schemas as
   local `supabase/config.toml` (`schemas = ["public", "storage", "graphql_public", "geo", "budget"]`):
   - Open `https://supabase.com/dashboard/project/{project_id}/integrations/data_api/settings`
   - Under exposed schemas, add `geo` and `budget` if missing.
   - Missing schemas fail with `Invalid schema: <name>` during export.

### Behaviour notes

- Only tables listed in `scripts/db-seed/db-seed.config.ts` are exported.
  Local-first tables (`deployments`, `user_profiles`, `user_roles`) are
  intentionally omitted from config, so export never overwrites them.
- Shared `SEED_COUNTRIES` / `SEED_STATION_IDS` consts keep station-linked
  tables (`climate_stations`, `climate_station_data`, `crop_data_downscaled`)
  scoped to the same representative locations.
- `created_at` / `updated_at` are stripped from every export (DB defaults
  repopulate on import). Tables sort by `id` for stable diffs — override via
  `orderBy` in config where no `id` column exists (e.g. geo tables).
- `climate_station_data` exports a filtered subset only (see `filter` in config).
- A `0 rows` export with the secret key means the remote table is genuinely
  empty (the secret key bypasses RLS, so this is never an access issue).
- TypeScript types (`gen-types`) are generated from the local docker DB, not
  the remote — run `yarn nx run picsa-server:gen-types` after a local
  migration or reset/seed instead.
