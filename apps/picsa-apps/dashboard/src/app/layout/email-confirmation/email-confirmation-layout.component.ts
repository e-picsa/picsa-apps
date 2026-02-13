import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseAuthService } from '@picsa/shared/services/core/supabase/services/supabase-auth.service';

import { DashboardAuthService } from '../../modules/auth/services/auth.service';

@Component({
  selector: 'dashboard-email-confirmation-layout',
  templateUrl: './email-confirmation-layout.component.html',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailConfirmationLayoutComponent {
  private authService = inject(DashboardAuthService);
  private notificationService = inject(PicsaNotificationService);
  private supabaseAuthService = inject(SupabaseAuthService);

  public userEmail = computed(() => this.authService.authUser()?.email);

  async resendConfirmation() {
    const email = this.userEmail();
    if (!email) return;
    await this.supabaseAuthService.resendEmailConfirmation(email);

    this.notificationService.showUserNotification({
      message: 'Email sent, please check your inbox and junk folder',
      matIcon: 'mark_email_read',
    });
  }

  async logout() {
    await this.supabaseAuthService.signOut();
    window.location.reload();
  }
}
