import type { Database } from '../../../types/db.types.ts';

// Partial auth user data shared
export type IAdminListUsersResponse = {
  email: string | undefined;
  email_confirmed_at: string | undefined;
  id: any;
  last_sign_in_at: string | undefined;
}[];

export type IAdminListUserRolesResponse = Database['public']['Tables']['user_roles']['Row'][];
