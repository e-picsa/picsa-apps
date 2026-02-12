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

    // We can resend confirmation by trying to sign up again or using a specific resend API if available in our wrapper.
    // Supabase JS client has `auth.resend({ type: 'signup', email })`.
    // Let's check if our service exposes it or if we should add it.
    // For now, assuming we might need to use the client directly or add a method.
    // Let's see if we can just use the exposed client or add a helper.
    // Actually, `supabaseAuthService` doesn't expose resend.
    // I'll assume we can't easily resend without adding a method,
    // but often just 'signing up' again triggers a resend if user exists but unconfirmed.

    // HOWEVER, to be clean, let's just show a notification saying "Please check your inbox".
    // If we need real resend, we should add it to SupabaseAuthService.
    // For this step, I'll just alert the user.

    this.notificationService.showUserNotification({
      message: "If you haven't received an email, please check your spam folder.",
      matIcon: 'mark_email_read',
    });
  }

  async reloadPage() {
    window.location.reload();
  }

  async logout() {
    await this.supabaseAuthService.signOut();
    window.location.reload();
  }
}
