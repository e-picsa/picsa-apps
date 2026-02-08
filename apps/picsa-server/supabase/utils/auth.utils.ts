import type { Database } from '../types/db.types.ts';

type AppRole = Database['public']['Enums']['app_role'];

/**
 * Exhaustive list of all app roles
 * When new role enums are updated they must be added here or will fail type-checks
 */
const APP_ROLES_MAP: Record<AppRole, boolean> = {
  'resources.viewer': true,
  'resources.author': true,
  'resources.admin': true,
  'deployments.admin': true,
  'deployments.viewer': true,
  'deployments.author': true,
  'translations.viewer': true,
  'translations.author': true,
  'translations.admin': true,
  'climate.viewer': true,
  'climate.author': true,
  'climate.admin': true,
  viewer: true,
  author: true,
  admin: true,
};

export const APP_ROLES = Object.keys(APP_ROLES_MAP) as AppRole[];

export function assignImplicitRoles(authRoles: AppRole[]): AppRole[] {
  // assume all roles for global or deployment admin
  if (authRoles.includes('admin') || authRoles.includes('deployments.admin')) {
    return APP_ROLES;
  }

  // assign default roles to all deployments
  let globalRole: AppRole = 'viewer';
  if (authRoles.includes('author')) globalRole = 'author';
  if (authRoles.includes('admin')) globalRole = 'admin';

  const implicitRoles: AppRole[] = [];
  for (const role of authRoles) {
    const [feature, level] = role.split('.');
    // assign implicit auth roles (anything lower than current level)
    if (level === 'admin') {
      implicitRoles.push(`${feature}.author` as AppRole);
    }
    if (level === 'admin' || level === 'author') {
      implicitRoles.push(`${feature}.viewer` as AppRole);
    }
  }
  const uniqueRoles = new Set([globalRole, ...authRoles, ...implicitRoles]);
  console.log({ authRoles, uniqueRoles });
  return [...uniqueRoles] as AppRole[];
}
