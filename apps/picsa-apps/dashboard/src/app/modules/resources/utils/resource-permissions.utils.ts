import { computed, effect, inject, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { DashboardAuthService } from '../../auth/services/auth.service';

/**
 * Shared reactive permission state for resource create/edit pages (`resource_files`, `resource_links`).
 * - `resources.admin` can create/edit all resources.
 * - `resources.editor` can create new resources or edit resources they own (`owner === authUserId`).
 * - Automatically enables/disables the bound form control as `canEdit` changes.
 */
export function createResourceEditPermissionState(authService: DashboardAuthService, form: AbstractControl) {
  const route = inject(ActivatedRoute, { optional: true });
  const initialId = route?.snapshot.params['id'];
  const isCreate = signal(!initialId || initialId === 'create');
  const resourceOwner = signal<string | null>(null);

  const canEdit = computed(() => {
    if (authService.hasRole('resources.admin')) {
      return true;
    }
    if (authService.hasRole('resources.editor')) {
      if (isCreate()) return true;
      const owner = resourceOwner();
      const userId = authService.authUserId();
      return Boolean(owner && userId && owner === userId);
    }
    return false;
  });

  effect(() => {
    if (canEdit()) {
      form.enable({ emitEvent: false });
    } else {
      form.disable({ emitEvent: false });
    }
  });

  return { isCreate, resourceOwner, canEdit };
}
