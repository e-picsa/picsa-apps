import type { AppRole } from '../types/index.ts';

/**
 * Exhaustive list of all app roles
 * When new role enums are updated they must be added here or will fail type-checks
 */
const APP_ROLES_MAP: Record<AppRole, boolean> = {
  admin: true,
  'climate.admin': true,
  'deployments.admin': true,
  'resources.admin': true,
  'resources.editor': true,
  'translations.editor': true,
  'translations.admin': true,
};

export const APP_ROLES = Object.keys(APP_ROLES_MAP) as AppRole[];

export function assignImplicitRoles(authRoles: AppRole[]): AppRole[] {
  // assume all roles for global or deployment admin
  if (authRoles.includes('admin') || authRoles.includes('deployments.admin')) {
    return APP_ROLES;
  }
  const implicitRoles: AppRole[] = [];
  for (const role of authRoles) {
    const [feature, level] = role.split('.');
    // assign implicit auth roles (anything lower than current level)
    if (level === 'admin') {
      const editorRole = `${feature}.editor` as AppRole;
      if (editorRole in APP_ROLES_MAP) {
        implicitRoles.push(editorRole);
      }
    }
  }
  const uniqueRoles = new Set([...authRoles, ...implicitRoles]);
  return [...uniqueRoles] as AppRole[];
}
