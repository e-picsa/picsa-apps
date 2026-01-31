import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { ENVIRONMENT } from '@picsa/environments/src';
import { SupabaseAuthService } from '@picsa/shared/services/core/supabase/services/supabase-auth.service';

@Component({
  selector: 'dashboard-profile-menu',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, RouterModule],
  templateUrl: './profile-menu.component.html',
  styleUrls: ['./profile-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileMenuComponent implements AfterViewInit {
  supabaseAuthService = inject(SupabaseAuthService);

  async ngAfterViewInit() {
    // HACK - use anonymous user when running in dev
    if (!ENVIRONMENT.production) {
      await this.supabaseAuthService.signInDashboardDevUser();
    }
  }
}
