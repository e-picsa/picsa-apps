### Remote DB Mirroring & Extended Seed Architecture (`db:seed:extended` / `remote:pull`)

- **Unified Seed Architecture in `db-seed-export.ts`**:
  Instead of fragile external dump scripts, `db-seed-export.ts` handles both CSV export and direct database seeding.
  - `SEED_DATA_BASE` (`scripts/db-seed/db-seed.config.ts`): Base schema, sort orders, priorities, column mappings, and metadata omissions.
  - `SEED_DATA_CONFIG`: Extends base with subset filters (e.g. `SEED_STATION_IDS`) for committing minimal baseline CSVs to `supabase/data`.
  - `SEED_DATA_EXTENDED_CONFIG`: Extends base _without_ filters to clone complete datasets directly into the local database without writing CSVs (`yarn nx run picsa-server:db:seed:extended`).
- **Dev Users & Storage Seeding**:
  `supabase/seed.sql` creates local dev users (`admin@picsa.app`, `user@picsa.app`) automatically on `supabase db reset`. In extended mode, `db-seed-export.ts` directly seeds local storage objects and baseline configurations post-import so local logins work out of the box.
