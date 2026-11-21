# App Migrations

Lightweight one-time migration runner executed on app startup (`AppComponent.ngOnInit` → `PicsaMigrationService.runMigrations`) before tools initialize.

## Authoring Rules

1. **One file per migration** in `libs/migrations/migrations/YYYYMMDD-<slug>.ts`, registered in `libs/migrations/migrations/index.ts`.
2. **Encapsulate legacy types locally**: Extend current interfaces locally (e.g. `interface ILegacyUserSettings extends IUserSettings { ... }`) inside the migration file. Do **not** leave `@deprecated` legacy fields or runtime migration hooks in core services like `ConfigurationService`.
3. **Always return a diagnostic result**: `up(injector)` must return a non-empty `string` or plain object (e.g. `{ status: 'migrated', from, to }` or `{ status: 'skipped', reason }`).
   - `PicsaMigrationService` logs the returned result under the `[Migrations]` console group and stores it in `localStorage.picsa_app_migration_history[id].result`.
   - Completion is gated on a truthy `history[id].result` — returning `undefined` previously caused migrations to re-run on every reload with no diagnostic output.
4. **Set `app_version` to the next release version**: Users whose `picsa_app_first_install_version >= app_version` skip the migration automatically.

## Testing Locally

To simulate an upgrading user in DevTools:

1. Set `localStorage.picsa_app_first_install_version` to a version lower than `app_version` (e.g. `'5.17.0'`).
2. Remove the migration's id from `localStorage.picsa_app_migration_history` (or clear the key).
3. Seed the legacy state (e.g. `localStorage.picsa_user_settings`), reload, and inspect the `[Migrations]` console group + updated `localStorage`.
