import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { IAuthRole } from '@picsa/shared/services/core/supabase/services/supabase-auth.service';

import { AuthRoleRequiredDirective } from '../../../auth/directives/authRoleRequired.directive';
import { ClimateService } from '../../climate.service';
import { ApiMapping, ApiRequest } from '../../climate-api.mapping';

export type ApiStatusState = 'PENDING' | 'LOADING' | 'SUCCESS' | 'ERROR';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dashboard-api-status',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    AuthRoleRequiredDirective,
  ],
  templateUrl: './api-status.component.html',
  styleUrl: './api-status.component.scss',
})
export class ApiStatusComponent {
  private climateService = inject(ClimateService);
  private supabaseService = inject(SupabaseService);
  private notificationService = inject(PicsaNotificationService);

  // Initialize the API mapping logic
  private apiMapping = ApiMapping(this.climateService, this.supabaseService);

  public id = input.required<string>();
  public label = input<string>();
  public request = input.required<ApiRequest>();
  public requiredRole = input<IAuthRole>();

  public autoStart = input<boolean>(false);

  // Status signals
  public status = signal<ApiStatusState>('PENDING');
  public error = signal<string | undefined>(undefined);
  public lastRun = signal<Date | undefined>(undefined);

  constructor() {
    // If autoStart, we could trigger here, but usually safer in ngOnInit or effect
  }

  public async runApi() {
    this.status.set('LOADING');
    this.error.set(undefined);

    try {
      const { endpoint, params } = this.request();
      const apiFunction = this.apiMapping[endpoint];
      if (!apiFunction) {
        throw new Error(`Unknown endpoint: ${endpoint}`);
      }

      await (apiFunction as any)(params);

      this.status.set('SUCCESS');
      this.lastRun.set(new Date());
    } catch (err: any) {
      console.error(`API Error for ${this.request().endpoint}:`, err);
      this.status.set('ERROR');
      const errorMessage = err.message || 'Unknown error';
      this.error.set(errorMessage);
      this.notificationService.showErrorNotification(`[${this.label() || this.request().endpoint}] ${errorMessage}`);
    }
  }
}
