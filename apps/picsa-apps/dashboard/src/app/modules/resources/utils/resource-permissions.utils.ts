import { computed, effect, inject, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { DashboardAuthService } from '../../auth/services/auth.service';

export interface IResourcePermissionOptions {
  /**
   * When true, any `resources.editor` can edit the resource regardless of `owner`,
   * while `canDelete` remains restricted to `resources.admin` or the resource `owner`.
   */
  allowAnyEditorEdit?: boolean;
}

/**
 * Shared reactive permission state for resource create/edit pages (`resource_files`, `resource_links`, `resource_collections`).
 * - `resources.admin` can create/edit/delete all resources.
 * - `resources.editor` can create new resources, edit owned resources (or any collection when `allowAnyEditorEdit` is true),
 *   and delete only resources they own (`owner === authUserId`).
 * - Automatically enables/disables the bound form control as `canEdit` changes.
 */
export function createResourceEditPermissionState(
  authService: DashboardAuthService,
  form: AbstractControl,
  options?: IResourcePermissionOptions,
) {
  const route = inject(ActivatedRoute, { optional: true });
  const initialId = route?.snapshot.params['id'];
  const isCreate = signal(!initialId || initialId === 'create');
  const resourceOwner = signal<string | null>(null);

  const isOwner = computed(() => {
    const owner = resourceOwner();
    const userId = authService.authUserId();
    return Boolean(owner && userId && owner === userId);
  });

  const canEdit = computed(() => {
    if (authService.hasRole('resources.admin')) {
      return true;
    }
    if (authService.hasRole('resources.editor')) {
      if (isCreate() || options?.allowAnyEditorEdit) return true;
      return isOwner();
    }
    return false;
  });

  const canDelete = computed(() => {
    if (isCreate()) return false;
    if (authService.hasRole('resources.admin')) {
      return true;
    }
    if (authService.hasRole('resources.editor')) {
      return isOwner();
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

  return { isCreate, resourceOwner, canEdit, canDelete };
}
