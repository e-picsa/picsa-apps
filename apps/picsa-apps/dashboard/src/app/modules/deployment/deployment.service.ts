import { Injectable, signal } from '@angular/core';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { IDeploymentRow } from './types';

@Injectable({ providedIn: 'root' })
export class DeploymentDashboardService extends PicsaAsyncService {
  public readonly deployments = signal<IDeploymentRow[]>([]);

  public get table() {
    return this.supabaseService.db.table('deployments');
  }

  constructor(private supabaseService: SupabaseService, private notificationService: PicsaNotificationService) {
    super();
  }

  public override async init() {
    await this.supabaseService.ready();
    await this.listDeployments();
  }

  private async listDeployments() {
    const { data, error } = await this.table.select<'*', IDeploymentRow>('*');
    if (error) {
      throw error;
    }
    this.deployments.set(data);
  }
}
