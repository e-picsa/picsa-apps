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
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
  selector: 'dashboard-sign-in-dialog',
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: 'sign-in-dialog.component.html',
  styleUrl: 'sign-in-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupabaseSignInDialogComponent {
  private notificationService = inject(PicsaNotificationService);
  private supabaseAuthService = inject(SupabaseAuthService);

  public title = 'Sign In';
  public template: 'signIn' | 'register' | 'reset' = 'signIn';

  errorMatcher = new showErrorAfterInteraction();

  public form = new FormGroup<{ email: FormControl; password: FormControl; passwordConfirm?: FormControl }>({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
  });

  private readonly dialogRef = inject(MatDialogRef<SupabaseSignInDialogComponent>);

  public enableResetMode() {
    this.template = 'reset';
    this.title = 'Reset Password';
    this.form.removeControl('passwordConfirm');
  }

  public enableSignInMode() {
    this.template = 'signIn';
    this.title = 'Sign In';
    this.form.removeControl('passwordConfirm');
  }

  public enableRegisterMode() {
    this.template = 'register';
    this.title = 'Register';
    this.form.addControl(
      'passwordConfirm',
      new FormControl('', [Validators.required, PICSAFormValidators.passwordMatch]),
    );
  }

  public async handleSignIn() {
    this.form.disable();
    const { email, password } = this.form.value;
    const { data, error } = await this.supabaseAuthService.signInUser(email, password);
    console.log({ data, error });
    if (error) {
      this.form.enable();
      throw new Error(error.message);
    } else {
      this.dialogRef.close();
    }
  }
  public async handleRegister() {
    this.form.disable();
    const { email, password } = this.form.value;
    const { error } = await this.supabaseAuthService.signUpUser(email, password);
    if (error) {
      this.form.enable();
      throw new Error(error.message);
    } else {
      this.dialogRef.close();
    }
  }
  public async handleReset() {
    this.form.disable();
    const { email } = this.form.value;
    const { error } = await this.supabaseAuthService.resetEmailPassword(email);
    if (error) {
      this.form.enable();
      throw new Error(error.message);
    } else {
      this.notificationService.showSuccessNotification(`Reset email sent, please check your inbox`, { duration: 5000 });
      this.dialogRef.close();
    }
  }
}
