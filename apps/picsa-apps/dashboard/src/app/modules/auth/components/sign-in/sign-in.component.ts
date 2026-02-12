import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import {
  COUNTRIES_DATA as COUNTRIES,
  getOrganisationsForCountry,
  ICountryCode,
  IOrganisation,
} from '@picsa/data/deployments';
import { PICSAFormValidators } from '@picsa/forms';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseAuthService } from '@picsa/shared/services/core/supabase/services/supabase-auth.service';
import { map, startWith } from 'rxjs/operators';
import zxcvbn from 'zxcvbn';

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
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: 'sign-in.component.html',
  styleUrl: 'sign-in.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSignInComponent {
  private notificationService = inject(PicsaNotificationService);
  private supabaseAuthService = inject(SupabaseAuthService);

  countries = COUNTRIES;
  organisations = signal<IOrganisation[]>([]);

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  registerForm = new FormGroup({
    fullName: new FormControl('', [Validators.required]),
    country: new FormControl<ICountryCode | null>(null, [Validators.required]),
    organization: new FormControl('', [Validators.required]),
    organization_other: new FormControl(''),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, this.passwordStrengthValidator]),
    passwordConfirm: new FormControl('', [Validators.required, PICSAFormValidators.passwordMatch]),
  });

  public passwordStrength = toSignal(
    this.registerForm.controls.password.valueChanges.pipe(
      map((value) => {
        if (!value) return 0;
        const result = zxcvbn(value);
        return result.score;
      }),
    ),
    { initialValue: 0 },
  );

  public showOtherOrgInput = toSignal(
    this.registerForm.controls.organization.valueChanges.pipe(map((value) => value === 'Other')),
    { initialValue: false },
  );

  public showPassword = signal(false);
  public showConfirmPassword = signal(false);

  constructor() {
    this.registerForm.controls.country.valueChanges
      .pipe(startWith(this.registerForm.controls.country.value))
      .subscribe((countryCode) => {
        if (countryCode) {
          this.organisations.set(getOrganisationsForCountry(countryCode));
        } else {
          this.organisations.set([]);
        }
      });

    effect(() => {
      if (this.showOtherOrgInput()) {
        this.registerForm.controls.organization_other.setValidators([Validators.required]);
      } else {
        this.registerForm.controls.organization_other.clearValidators();
        this.registerForm.controls.organization_other.setValue('');
      }
      this.registerForm.controls.organization_other.updateValueAndValidity();
    });
  }

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
    if (this.registerForm.invalid) return;
    this.registerForm.disable();
    const { email, password, fullName, country, organization, organization_other } = this.registerForm.getRawValue();

    const finalOrganisation = organization === 'Other' ? organization_other : organization;

    if (!email || !password || !fullName || !finalOrganisation || !country) {
      this.registerForm.enable();
      return;
    }

    const { error } = await this.supabaseAuthService.signUpUser(email, password, {
      full_name: fullName,
      country_code: country,
      organisation: finalOrganisation,
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
      this.notificationService.showSuccessNotification('Password reset instructions sent to your email');
    }
  }
}
