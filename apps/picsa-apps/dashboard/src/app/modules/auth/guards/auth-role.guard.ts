import { computed, inject, Injector } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { AppRole } from '@picsa/server-types';
import { filter, firstValueFrom } from 'rxjs';

import { DeploymentDashboardService } from '../../deployment/deployment.service';
import { DashboardAuthService } from '../services/auth.service';

export const authRoleGuard = (role: AppRole): CanActivateFn => {
  return async () => {
    const authService = inject(DashboardAuthService);
    const deploymentService = inject(DeploymentDashboardService);
    const router = inject(Router);
    const injector = inject(Injector);

    const isReady = computed(() => {
      if (!authService.isAuthChecked()) return false;
      if (!authService.authUserId()) return true;
      if (!deploymentService.isDeploymentChecked()) return false;
      return authService.activeDeploymentId() === deploymentService.activeDeploymentId();
    });

    if (!isReady()) {
      await firstValueFrom(toObservable(isReady, { injector }).pipe(filter(Boolean)));
    }

    if (authService.hasRole(role)) {
      return true;
    }

    // Redirect to home if user doesn't have permission
    return router.parseUrl('/');
  };
};
