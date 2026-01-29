import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { PICSAFormValidators } from '@picsa/forms';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseAuthService } from '@picsa/shared/services/core/supabase/services/supabase-auth.service';

export interface ISignInDialogData {
  authService: SupabaseAuthService;
}

/**
 * Implement custom error handler to only display if control is dirty, touched, or submitted.
 * https://material.angular.io/components/input/overview#changing-when-error-messages-are-shown
 * */
export class showErrorAfterInteraction implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'dashboard-sign-in',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatTabsModule, ReactiveFormsModule],
  templateUrl: 'sign-in.component.html',
  styleUrl: 'sign-in.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSignInComponent {
  private notificationService = inject(PicsaNotificationService);
  private supabaseAuthService = inject(SupabaseAuthService);

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
