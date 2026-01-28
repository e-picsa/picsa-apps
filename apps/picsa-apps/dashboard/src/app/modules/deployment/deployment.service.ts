import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { GEO_LOCATION_DATA, GEO_LOCATION_PLACEHOLDER, IGelocationData } from '@picsa/data/geoLocation';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { SupabaseAuthService } from '@picsa/shared/services/core/supabase/services/supabase-auth.service';
import { filter, firstValueFrom, map } from 'rxjs';

import { IDeploymentRow } from './types';

@Injectable({ providedIn: 'root' })
export class DeploymentDashboardService {
  private supabaseService = inject(SupabaseService);
  private supabaseAuthService = inject(SupabaseAuthService);

  public readonly deployments = signal<IDeploymentRow[]>([]);
  // all routing is blocked unless deployment set, so consumers can safely assume will be defined
  public readonly activeDeployment = signal<IDeploymentRow>(null as any);

  /** Country code for active deployment */
  public activeDeploymentCountry = computed(() => this.activeDeployment().country_code);

  /** Geolocation data for active deployment */
  public activeDeploymentLocationData = computed<IGelocationData>(() => {
    const countryCode = this.activeDeploymentCountry();
    return GEO_LOCATION_DATA[countryCode] || GEO_LOCATION_PLACEHOLDER;
  });

  /** Observable activeDeployment used to monitor changes (ensure deployment selected) */
  private activeDeployment$ = toObservable(this.activeDeployment);

  public get table() {
    return this.supabaseService.db.table('deployments');
  }

  constructor() {
    effect(async () => {
      const authUser = this.supabaseAuthService.authUser();
      if (authUser) {
        await this.listDeployments();
        this.loadStoredDeployment();
      }
    });
  }

  public async setActiveDeployment(id: string, opts = { forceReload: true }) {
    const previousId = this.activeDeployment()?.id;
    if (id === previousId) return;
    // provide optimistic update
    this.activeDeployment.set(this.deployments().find((d) => d.id === id) || (null as any));
    // provide server update
    // TODO - subscribe to realtime updates
    // TODO - consider just using hardcoded deployments to prevent need for optimistic updates
    const { data } = await this.table.select<'*', IDeploymentRow>('*').eq('id', id).limit(1).single();
    this.activeDeployment.set(data || (null as any));
    this.storeDeployment(data?.id);
    // Hack - when changing deployment from UI component force reload to ensure data updated
    if (previousId && opts.forceReload) {
      location.reload();
    }
  }

  /** Promise that resolves only once an active deployment has been selected */
  public async ensureActiveDeployment(): Promise<IDeploymentRow> {
    const deployment = this.activeDeployment();
    if (deployment) {
      return deployment;
    }
    return firstValueFrom(
      this.activeDeployment$.pipe(
        filter((d) => d !== null),
        map((d) => d as IDeploymentRow),
      ),
    );
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
      this.setActiveDeployment(id, { forceReload: false });
    }
  }
}
