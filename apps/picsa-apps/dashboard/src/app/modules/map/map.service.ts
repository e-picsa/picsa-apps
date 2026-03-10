import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DeploymentDashboardService } from '../deployment/deployment.service';

export interface AdminBoundariesPayload {
  country_code: string;
  admin_level: number;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardMapService {
  private supabaseService = inject(SupabaseService);
  private deploymentService = inject(DeploymentDashboardService);

  public isLoading = signal(false);
  public boundaries = signal<any[]>([]);

  public async fetchBoundaries() {
    const code = this.deploymentService.activeDeploymentCountry();
    if (!code) return;

    this.isLoading.set(true);
    try {
      // Access the underlying supabase client to query a non-public schema
      const client = (this.supabaseService as any).supabase;
      const { data, error } = await client.schema('geo').from('boundaries').select('*').eq('country_code', code);

      if (!error && data) {
        this.boundaries.set(data);
      } else if (error) {
        console.error('Error fetching boundaries:', error);
      }
    } catch (e) {
      console.error('Failed to fetch boundaries', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  public async generateBoundaries(adminLevel: number) {
    const code = this.deploymentService.activeDeploymentCountry();
    if (!code) return;

    const payload: AdminBoundariesPayload = {
      country_code: code,
      admin_level: adminLevel,
    };

    this.isLoading.set(true);
    try {
      await this.supabaseService.invokeFunction('geo/admin-boundaries', { body: payload });
      await this.fetchBoundaries();
    } catch (e) {
      console.error('Failed to invoke geo/admin-boundaries', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  public async updateAdminLevelLabel(adminLevel: number, newLabel: string) {
    const code = this.deploymentService.activeDeploymentCountry();
    if (!code) return;

    this.isLoading.set(true);
    try {
      const client = (this.supabaseService as any).supabase;
      const { error } = await client
        .schema('geo')
        .from('boundaries')
        .update({ label: newLabel })
        .eq('country_code', code)
        .eq('admin_level', adminLevel);

      if (error) {
        console.error('Error updating boundary label:', error);
      } else {
        await this.fetchBoundaries();
      }
    } catch (e) {
      console.error('Failed to update boundary label', e);
    } finally {
      this.isLoading.set(false);
    }
  }
}
