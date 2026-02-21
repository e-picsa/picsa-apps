# AI Generated Knowledge

This file is a shared knowledge base for AI agents operating on this codebase.

## Instructions for Agents

1.  **Read this file** at the start of your session to learn from previous agent experiences.
2.  **Append to this file** if you discover:
    - Specific "gotchas" or tricky implementation details.
    - Workarounds for recurring issues.
    - Patterns that work well for this specific architecture.
3.  **Format**: Use the following format for entries:

```markdown
### [Topic/Issue Name]

**Date**: YYYY-MM-DD
**Context**: [Brief context of the task]
**Learning**: [What you learned or the solution you found]
```

---

## Knowledge Base

### Verification Entry

**Date**: 2026-02-06
**Context**: Verifying the new AI self-documentation workflow.
**Learning**: Agents can successfully append to this file to share knowledge.

### Supabase User Role Management Implementation

**Date**: 2026-02-08
**Context**: Implementing user role management UI and Backend functions in `user-permissions.component.ts`.
**Learning**:

1. **Database**: Roles are stored in `user_roles` table (deployment_id, user_id, roles[]).
2. **Auth Hook**: `custom_access_token_hook` injects these roles into JWT `picsa_roles` claim.
3. **Backend Logic**:
   - `add-user.ts` and `update-user-roles.ts` (new) handle role changes.
   - Validation ensures users cannot assign roles they do not possess.
   - `_shared/auth.ts` was updated to treat `deployments.admin` as a super-admin for the deployment, bypassing specific role checks.
4. **Frontend**:
   - `DashboardAuthService` computes available roles and handles implicit role inheritance using `@picsa/shared/utils/role.utils`.
   - `user-permissions.component.ts` uses `availableRoles` from `DashboardAuthService`.
   - `APP_ROLES` is now derived from the shared utility's exhaustive `APP_ROLES_MAP`.
   - `assignImplicitRoles` in both frontend and backend now uses the robust shared implementation that expands Global Admin/Author roles to all feature roles.

### Role-Based Route Protection

**Date**: 2026-02-10
**Context**: Implement route guards for the dashboard `climate -> admin` page.
**Learning**:

1.  **Auth Logic Encapsulation**: `DashboardAuthService` now has a `hasRole(role: AppRole)` method for checking permissions. This replaces ad-hoc logic in directives.
2.  **Route Guard**: `authRoleGuard` is a functional guard in `dashboard/src/app/modules/auth/guards` that uses `DashboardAuthService.hasRole`.
3.  **Directives**: `AuthRoleRequiredDirective` also uses `DashboardAuthService.hasRole` for consistency.
4.  **Navigation**: `navLinks.ts` defines role requirements for menu items, which are enforced by `authenticated-layout.component`.

### Supabase Environment Detection & Local Email Fallback

**Date**: 2026-02-19
**Context**: Configuring email systems to send to Resend in production, but route to the Supabase local Inbucket (Mailpit) instance during development.
**Learning**:

1. **Detecting Local Env**: In Supabase Edge Functions, you can determine if you are running locally inside the Supabase Docker container by checking the `SUPABASE_URL` environment variable. Locally, it often resolves to the API gateway (e.g., `http://kong:8000`). Checking `Deno.env.get('SUPABASE_URL')?.includes('kong')` or the absence of production keys (`RESEND_API_KEY`) is a reliable heuristic.
2. **Local Inbucket SMTP**: The local Supabase environment runs an email sink called Inbucket (formerly Mailpit). This service exposes an SMTP server on port `1025` internally inside the docker network (even though the web interface is mapped to 54324).
3. **Usage via Edge Functions**: You can use `npm:nodemailer` in a Deno Edge function to route emails to `host: 'inbucket', port: 1025, ignoreTLS: true`. These emails will then appear in the local Supabase studio at `http://localhost:54324/`.

### Edge Functions and Triggers Architecture

**Date**: 2026-02-19
**Context**: Implementing Access Requests and Email Notifications.
**Learning**:

1.  **Dashboard API**: UI interactions should not hit the database directly with complex constraints (like `insertion`) when they represent larger domain actions. Instead, use Edge Functions under `dashboard/{module}/{endpoint}` (e.g., `dashboard/deployments/request-access`).
2.  **Modularity**: Third-party service integrations (like Resend for emails) must be modularized into `_shared/` directory (e.g., `_shared/email.ts`) rather than duplicated across multiple Edge Functions.
3.  **Database Webhooks via Edge Functions**:
4.  **Database Webhooks & Triggers**:
    - Avoid sending emails or doing external API calls synchronously from the Dashboard API Edge Functions. Use `AFTER INSERT/UPDATE` database triggers to invoke background tasks asynchronously.
    - **Trigger Method Comparison**:
      - **`public.call_edge_function(name, body)` (Preferred for Supabase Edge Functions)**:
        - _Strengths_: Dynamically resolves `project_url` and `anon_key` from `private.get_secret(...)`. This means your SQL migrations won't break across local, staging, and production environments with hardcoded IP addresses. It allows for a totally custom JSON body.
        - _Weaknesses_: Requires you to write an intermediate PL/pgSQL function to act as the trigger handler (since `call_edge_function` takes arguments).
      - **`supabase_functions.http_request(url, method, headers, params, timeout)` (Preferred for 3rd Party Webhooks)**:
        - _Strengths_: It natively constructs the standard Supabase webhook payload (`{"old_record": ..., "record": ..., "type": ...}`). It can be attached directly to a trigger `EXECUTE FUNCTION supabase_functions.http_request(...)` without an intermediate wrapper. Logs to `supabase_functions.hooks`.
        - _Weaknesses_: You must hardcode the `url` (e.g. `http://172.17.0.1:54321/...`) which will cause errors across different deployment environments unless heavily manipulated. It does not auto-inject Supabase auth headers.
    - **Recommendation**: Always use `public.call_edge_function` wrapped in a custom PL/pgSQL trigger function when invoking an internal Supabase Edge Function to ensure environment portability.
    - **Local Development Note**: The `anon_key` generated by Supabase CLI for local development is **deterministic** across all developer machines. Always seed this deterministic key into `vault.decrypted_secrets` via `supabase/seed.sql` (e.g., `select vault.create_secret('eyJhb...', 'anon_key', 'supabase local anon key');`) so that `call_edge_function` triggers work out-of-the-box locally without Missing Authorization Header errors from the Kong API Gateway. Production environments will securely override this secret via the Supabase Dashboard Vault.

### Edge Function Resource Bundling

**Date**: 2026-02-19
**Context**: Serving an HTML email template from within a Deno Edge Function without the compiler excluding the non-TS file.
**Learning**:

1. When deploying Edge Functions, the Deno bundler (esbuild) automatically statically analyzes `.ts` imports. However, it completely strips out and ignores arbitrary file types (like `.html`, `.json`) unless they are explicitly wrapped as ES Module exports.
2. The preferred native way to include these arbitrary files for use with `Deno.readTextFile()` is to declare them in the `supabase/config.toml` file under the corresponding function block.
   Example:
   ```toml
   [functions.dashboard]
   static_files = [ "./functions/dashboard/**/*.html" ]
   ```

### Agent Bootstrapping and Component Skills

**Date**: 2026-02-20
**Context**: Enforcing skill reading for Angular UI and component generation.
**Learning**: Always review `.agent/skills/angular/SKILL.md` and `.agent/skills/ui-theming/SKILL.md` before making UI or component changes. Pay special attention to:

1. Using `<button matButton>` instead of `<button mat-button>`.
2. Utilizing signal-based inputs (`input()`) and outputs (`output()`).
3. Appropriate use of semantic colors and standard tailwind classes.

### Code Organization and Refactoring

**Date**: 2026-02-20
**Context**: Refactoring backend Edge Functions (e.g., `notifyRequests`) to improve readability and maintainability.
**Learning**:

1. Always prefer smaller functions where possible. Functions should ideally be under 50 lines of code. Extract blocks like `INSERT`/`UPDATE` branch logic into their own dedicated helper functions.
2. Abstract common operations into shared utility files within the `_shared` directory (e.g., extracting template string substitution out of email edge functions into `_shared/template.ts`).
