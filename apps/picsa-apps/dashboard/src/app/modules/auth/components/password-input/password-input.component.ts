import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'dashboard-password-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  template: `
    <mat-form-field appearance="outline" [formGroup]="formGroup()">
      <mat-label>{{ label() }}</mat-label>
      <input
        matInput
        [formControlName]="controlName()"
        [type]="showPassword() ? 'text' : 'password'"
        [autocomplete]="autocomplete()"
      />
      <button matIconButton matSuffix (click)="showPassword.set(!showPassword())" type="button">
        <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
      </button>
      <mat-error>
        @if (control()?.hasError('required')) {
          Password is required
        } @else if (control()?.hasError('minlength') || control()?.hasError('minLength')) {
          Password must be at least 10 characters
        } @else if (control()?.hasError('weakPassword')) {
          Password is too weak
        } @else if (control()?.hasError('passwordMatch')) {
          Passwords must match
        }
      </mat-error>
    </mat-form-field>
  `,
  styles: `
    mat-form-field {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordInputComponent {
  formGroup = input.required<FormGroup>();
  controlName = input('password');
  label = input('Password');
  autocomplete = input('current-password');

  showPassword = signal(false);

  control = computed(() => this.formGroup().get(this.controlName()));
}
