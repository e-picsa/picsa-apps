### Remote DB Mirroring & Extended Seed Architecture (`db:seed:extended` / `remote:pull`)

- **Unified Seed Architecture in `db-seed-export.ts`**:
  Instead of fragile external dump scripts, `db-seed-export.ts` handles both CSV export and direct database seeding.
  - `SEED_DATA_BASE` (`scripts/db-seed/db-seed.config.ts`): Base schema, sort orders, priorities, column mappings, and metadata omissions.
  - `SEED_DATA_CONFIG`: Extends base with subset filters (e.g. `SEED_STATION_IDS`) for committing minimal baseline CSVs to `supabase/data`.
  - `SEED_DATA_EXTENDED_CONFIG`: Extends base _without_ filters to clone complete datasets directly into the local database without writing CSVs (`yarn nx run picsa-server:db:seed:extended`).
- **Admin Permissions on Deployments**:
  The seeded admin user (`00000000-0000-0000-0000-000000000000` / `admin@picsa.app`) requires rows in `public.user_roles` for every active deployment in `public.deployments` with roles `['admin', 'deployments.admin']`. This populates the `picsa_roles` JWT claim via the `custom_access_token_hook`, unlocking dashboard routes and permissions. This is automatically ensured by `seedDevUsersAndPermissions()` in both `db:seed` and `db:seed:extended`.
- **Per-Table Extended Seed Cache**:
  In extended mode, `db-seed-export.ts` validates and fetches remote data first, saving records into `apps/picsa-server/scripts/db-seed/cache/<table_name>.json` (gitignored). Offline seeding can be run via `yarn nx run picsa-server:db:seed:extended --no-fetch`.
- **Dev Users & Storage Seeding**:
  `supabase/seed.sql` creates local dev users (`admin@picsa.app`, `user@picsa.app`) automatically on `supabase db reset`. In extended mode, `db-seed-export.ts` directly seeds local storage objects and baseline configurations post-import so local logins work out of the box.
