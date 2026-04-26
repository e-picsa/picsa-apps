import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  AbstractControl,
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
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { ICountryCode } from '@picsa/data/deployments';
import { PICSAFormValidators } from '@picsa/forms';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseAuthService } from '@picsa/shared/services/core/supabase/services/supabase-auth.service';
import zxcvbn from 'zxcvbn';

import { ProfileFormComponent } from '../../../profile/components/profile-form/profile-form.component';
import { PasswordInputComponent } from '../password-input/password-input.component';
import { PasswordStrengthComponent } from '../password-strength/password-strength.component';

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
  imports: [
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatStepperModule,
    MatIconModule,
    MatProgressBarModule,
    ReactiveFormsModule,
    ProfileFormComponent,
    PasswordInputComponent,
    PasswordStrengthComponent,
  ],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: true },
    },
  ],
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

  // Step 1: Personal Details
  personalDetailsForm = new FormGroup({
    full_name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  // Step 2: Professional Details
  professionalDetailsForm = new FormGroup({
    country_code: new FormControl<ICountryCode | null>(null, [Validators.required]),
    organisation: new FormControl('', [Validators.required]),
    organisation_other: new FormControl(''),
  });

  // Step 3: Security
  securityForm = new FormGroup({
    password: new FormControl('', [Validators.required, this.passwordStrengthValidator]),
    passwordConfirm: new FormControl('', [Validators.required, PICSAFormValidators.passwordMatch]),
  });

  passwordStrengthValidator(control: AbstractControl) {
    const value = control.value;
    if (!value) return null;

    if (value.length < 10) {
      return { minLength: { requiredLength: 10, actualLength: value.length } };
    }

    const result = zxcvbn(value);
    if (result.score < 2) {
      return { weakPassword: { score: result.score } };
    }
    return null;
  }

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
    if (this.personalDetailsForm.invalid || this.professionalDetailsForm.invalid || this.securityForm.invalid) return;

    this.personalDetailsForm.disable();
    this.professionalDetailsForm.disable();
    this.securityForm.disable();

    const { full_name, email } = this.personalDetailsForm.getRawValue();
    const { country_code, organisation, organisation_other } = this.professionalDetailsForm.getRawValue();
    const { password } = this.securityForm.getRawValue();

    const finalOrganisation = organisation === 'OTHER' ? organisation_other : organisation;

    if (!email || !password || !full_name || !finalOrganisation || !country_code) {
      this.enableRegisterForms();
      return;
    }

    const { error } = await this.supabaseAuthService.signUpUser(email, password, {
      full_name,
      country_code,
      organisation: finalOrganisation,
    });

    if (error) {
      this.enableRegisterForms();
      this.notificationService.showErrorNotification(error.message);
    } else {
      this.notificationService.showSuccessNotification('Account created');
      this.resetRegisterForms();
      this.enableRegisterForms();
    }
  }

  private enableRegisterForms() {
    this.personalDetailsForm.enable();
    this.professionalDetailsForm.enable();
    this.securityForm.enable();
  }

  private resetRegisterForms() {
    this.personalDetailsForm.reset();
    this.professionalDetailsForm.reset();
    this.securityForm.reset();
  }

  async onForgotPassword() {
    const emailControl = this.loginForm.get('email');
    if (emailControl?.invalid || !emailControl?.value) {
      emailControl?.markAsTouched();
      this.notificationService.showErrorNotification('Please enter a valid email address to reset password');
      return;
    }

    const { error } = await this.supabaseAuthService.resetEmailPassword(emailControl.value);

    if (error) {
      this.notificationService.showErrorNotification(error.message);
    } else {
      this.notificationService.showUserNotification({
        message: 'Reset sent, please check your inbox and junk folder',
        matIcon: 'mark_email_read',
      });
    }
  }
}
