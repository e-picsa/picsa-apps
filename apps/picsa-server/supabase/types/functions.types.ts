import type { IForecastDBAPIResponse } from '../functions/dashboard/types.ts';

import type { IAdminListUserRolesResponse, IAdminListUsersResponse } from '../functions/dashboard/admin/types.ts';
import type { BudgetImportResponse, BudgetShareResponse, BudgetUnshareResponse } from '../functions/budget/types.ts';

/** Manually generated list of supabase function responses */
export type FunctionResponses = {
  Budget: {
    share: BudgetShareResponse;
    import: BudgetImportResponse;
    unshare: BudgetUnshareResponse;
  };
  Dashboard: {
    'forecast-db': IForecastDBAPIResponse;
    admin: {
      'list-users': IAdminListUsersResponse;
      'list-user-roles': IAdminListUserRolesResponse;
    };
  };
};
