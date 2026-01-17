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
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseAuthService } from '@picsa/shared/services/core/supabase/services/supabase-auth.service';

export class showErrorAfterInteraction implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'dashboard-password-reset.',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordResetComponent {
  private router = inject(Router);
  private supabaseAuthService = inject(SupabaseAuthService);
  private notificationService = inject(PicsaNotificationService);

  public form = new FormGroup<{ password: FormControl; confirmPassword?: FormControl }>({
    confirmPassword: new FormControl('', [Validators.required]),
    password: new FormControl('', Validators.required),
  });

  public async handlePasswordReset() {
    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.notificationService.showErrorNotification('Make sure your passwords match');
      return;
    }
    this.form.disable();
    const { error } = await this.supabaseAuthService.resetResetUserPassword(this.form.value.password);
    if (error) {
      this.form.enable();
      throw new Error(error.message);
    } else {
      this.notificationService.showSuccessNotification('Password reset successful');
      this.router.navigate(['/login']);
    }
  }
}
