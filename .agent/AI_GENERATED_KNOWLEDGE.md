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
