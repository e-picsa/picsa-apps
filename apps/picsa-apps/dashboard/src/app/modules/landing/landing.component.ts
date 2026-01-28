import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { APP_VERSION } from '@picsa/environments/src/version';
import { PICSAFormValidators } from '@picsa/forms';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseAuthService } from '@picsa/shared/services/core/supabase/services/supabase-auth.service';

@Component({
  selector: 'dashboard-landing-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {
  private notificationService = inject(PicsaNotificationService);
  private supabaseAuthService = inject(SupabaseAuthService);

  appVersion = APP_VERSION;

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  registerForm = new FormGroup({
    fullName: new FormControl('', [Validators.required]),
    organization: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    passwordConfirm: new FormControl('', [Validators.required, PICSAFormValidators.passwordMatch]),
  });

  async onLogin() {
    if (this.loginForm.invalid) return;
    this.loginForm.disable();
    const { email, password } = this.loginForm.getRawValue();

    if (!email || !password) {
      this.loginForm.enable();
      return;
    }

    const { error } = await this.supabaseAuthService.signInUser(email, password);

    if (error) {
      this.loginForm.enable();
      this.notificationService.showErrorNotification(error.message);
    }
  }

  async onRegister() {
    if (this.registerForm.invalid) return;
    this.registerForm.disable();
    const { email, password, fullName, organization } = this.registerForm.getRawValue();

    if (!email || !password || !fullName || !organization) {
      this.registerForm.enable();
      return;
    }

    const { error } = await this.supabaseAuthService.signUpUser(email, password, {
      full_name: fullName,
      organization: organization,
    });

    if (error) {
      this.registerForm.enable();
      this.notificationService.showErrorNotification(error.message);
    } else {
      this.notificationService.showSuccessNotification('Account created! Please check your email.');
      this.registerForm.reset();
      this.registerForm.enable();
    }
  }
}
