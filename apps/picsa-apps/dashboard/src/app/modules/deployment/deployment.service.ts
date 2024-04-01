import { Injectable, signal } from '@angular/core';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DashboardAuthService } from '../auth/services/auth.service';
import { IDeploymentRow } from './types';

@Injectable({ providedIn: 'root' })
export class DeploymentDashboardService extends PicsaAsyncService {
  public readonly deployments = signal<IDeploymentRow[]>([]);
  public readonly activeDeployment = signal<IDeploymentRow | null>(null);

  public get table() {
    return this.supabaseService.db.table('deployments');
  }

  constructor(private supabaseService: SupabaseService, private authService: DashboardAuthService) {
    super();
  }

  public override async init() {
    await this.supabaseService.ready();
    await this.authService.ready();
    await this.listDeployments();
    this.loadStoredDeployment();
  }

  public async setActiveDeployment(id: string) {
    // provide optimistic update
    this.activeDeployment.set(this.deployments().find((d) => d.id === id) || null);
    // provide server update
    // TODO - subscribe to realtime updates
    const { data } = await this.table.select<'*', IDeploymentRow>('*').eq('id', id).limit(1).single();
    this.activeDeployment.set(data);
    this.storeDeployment(data?.id);
  }

  private async listDeployments() {
    const { data, error } = await this.table.select<'*', IDeploymentRow>('*');
    if (error) {
      throw error;
    }
    this.deployments.set(data);
  }

  /** Store deployment id to localstorage to persist across sessions */
  private storeDeployment(id?: string) {
    if (id) {
      localStorage.setItem('picsa_dashboard_deployment', id);
    } else {
      localStorage.removeItem('picsa_dashboard_deployment');
    }
  }

  /** Retrieve persisted deployment id from localstorage and load */
  private loadStoredDeployment() {
    const id = localStorage.getItem('picsa_dashboard_deployment');
    if (id) {
      this.setActiveDeployment(id);
    }
  }
}
