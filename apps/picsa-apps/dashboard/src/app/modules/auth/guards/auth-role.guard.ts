import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppRole } from '@picsa/server-types';

import { DashboardAuthService } from '../services/auth.service';

export const authRoleGuard = (role: AppRole): CanActivateFn => {
  return () => {
    const authService = inject(DashboardAuthService);
    const router = inject(Router);

    if (authService.hasRole(role)) {
      return true;
    }

    // Redirect to home if user doesn't have permission
    return router.parseUrl('/');
  };
};
