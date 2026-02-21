import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { GEO_LOCATION_DATA, GEO_LOCATION_PLACEHOLDER, IGelocationData } from '@picsa/data/geoLocation';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { filter, firstValueFrom, map } from 'rxjs';

import { DashboardAuthService } from '../auth/services/auth.service';
import { IDeploymentRow } from './types';

export interface IAccessRequest {
  id: string;
  user_id: string;
  deployment_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class DeploymentDashboardService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(DashboardAuthService);

  /** List of all deployments retrieved from DB  */
  public readonly allDeployments = signal<IDeploymentRow[]>([]);

  /** List of all deployments a user is member of */
  public readonly userDeployments = computed(() => {
    const userRoles = this.authService.rolesByDeploymentId();
    if (!userRoles) return [];
    const userDeploymentIds = Object.keys(userRoles);
    return this.allDeployments().filter((d) => userDeploymentIds.includes(d.id));
  });

  // all routing is blocked unless deployment set, so consumers can safely assume will be defined
  public readonly activeDeployment = signal<IDeploymentRow>(null as any);

  public readonly activeDeploymentId = computed(() => this.activeDeployment()?.id);

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

  public isDeploymentChecked = signal(false);

  /** List of pending access requests for the current user */
  public readonly pendingRequests = signal<string[]>([]);

  constructor() {
    // Update auth roles when deployment changes
    effect(() => {
      const deploymentId = this.activeDeploymentId();
      this.authService.refreshAuthRoles(deploymentId);
    });
    // Update list of available deployments when user signs in
    effect(async () => {
      const authUserId = this.authService.authUserId();
      if (authUserId) {
        await this.listDeployments();
        this.loadStoredDeployment();
        this.isDeploymentChecked.set(true);
        // Load pending requests
        this.loadAccessRequests();
      }
    });
  }

  public async setActiveDeployment(id: string, opts = { forceReload: true }) {
    const previousId = this.activeDeployment()?.id;
    if (id === previousId) return;
    // provide optimistic update
    this.activeDeployment.set(this.allDeployments().find((d) => d.id === id) || (null as any));
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

  public async requestAccess(deploymentId: string, requestMessage?: string) {
    const user = this.authService.authUser();
    if (!user) return;

    try {
      const payload: any = { user_id: user.id, deployment_id: deploymentId };
      if (requestMessage) {
        payload.request_message = requestMessage;
      }

      const { error } = await this.supabaseService.db.table('deployment_access_requests').insert(payload);

      if (error) throw error;

      // Optimistically update pending requests
      this.pendingRequests.update((reqs) => [...reqs, deploymentId]);
    } catch (error) {
      console.error('Failed to request access:', error);
      throw error;
    }
  }

  public async getDeploymentAccessRequests(deploymentId: string) {
    const { data, error } = await this.supabaseService.db
      .table('deployment_access_requests')
      .select('*')
      .eq('deployment_id', deploymentId)
      .eq('status', 'pending');

    if (error) throw error;
    return data as IAccessRequest[];
  }

  public async updateAccessRequestStatus(requestId: string, status: 'approved' | 'rejected', responseMessage?: string) {
    const payload: any = { status };
    if (responseMessage) {
      payload.response_message = responseMessage;
    }

    const { error } = await this.supabaseService.db
      .table('deployment_access_requests')
      .update(payload)
      .eq('id', requestId);

    if (error) throw error;
  }

  private async listDeployments() {
    const { data, error } = await this.table.select<'*', IDeploymentRow>('*');
    if (error) {
      throw error;
    }
    this.allDeployments.set(data);
  }

  private async loadAccessRequests() {
    const user = this.authService.authUser();
    if (!user) return;

    const { data, error } = await this.supabaseService.db
      .table('deployment_access_requests')
      .select('deployment_id')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Failed to load access requests', error);
      return;
    }

    if (data) {
      this.pendingRequests.set(data.map((r) => r.deployment_id));
    }
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
