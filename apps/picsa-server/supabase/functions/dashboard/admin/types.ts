import type { Database } from '../../../types/db.types.ts';

// Partial auth user data shared
export type IAdminListUsersResponse = Database['public']['Functions']['get_non_anonymous_users']['Returns'];

export type IAdminListUserRolesResponse = Database['public']['Tables']['user_roles']['Row'][];
