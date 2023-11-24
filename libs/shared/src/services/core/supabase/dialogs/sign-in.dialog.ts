import { Component, Inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import type { SupabaseService } from '../supabase.service';
import { PicsaNotificationService } from '../../notification.service';

export interface ISignInDialogData {
  service: SupabaseService;
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

/**
 * Custom form validator to ensure passwords match. Adapted from
 * https://stackoverflow.com/a/51606362/5693245
 */
const validatePasswordMatch: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control) return null;
  const form = control.parent;
  if (!form) return null;
  const pass = form.get('password')?.value;
  return pass === control.value ? null : { notSame: true };
};

@Component({
  selector: 'picsa-supabase-sign-in-dialog',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  template: `
    <h1 mat-dialog-title>{{ title }}</h1>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field>
          <mat-label>Email</mat-label>
          <input
            type="email"
            matInput
            formControlName="email"
            autocomplete="picsa-email"
            [errorStateMatcher]="errorMatcher"
          />
          @if (form.controls.email.errors) {
          <mat-error>Please enter a valid email address</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Password</mat-label>
          <input type="password" matInput autocomplete="picsa-password" formControlName="password" />
        </mat-form-field>
        @if(template==='register'){
        <mat-form-field>
          <mat-label>Repeat Password</mat-label>
          <input
            type="password"
            matInput
            autocomplete="off"
            formControlName="passwordConfirm"
            [errorStateMatcher]="errorMatcher"
          />
          @if (form.controls.passwordConfirm?.errors) {
          <mat-error>Password must match</mat-error>
          }
        </mat-form-field>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="start">
      @if(template==='signIn'){
      <button mat-button (click)="enableRegisterMode()">Create new account</button>
      <button
        mat-button
        cdkFocusInitial
        (click)="handleSignIn()"
        style="margin-left:auto"
        [disabled]="!form.valid || form.disabled"
      >
        Sign In
      </button>
      } @if(template==='register'){
      <button
        mat-button
        cdkFocusInitial
        (click)="handleRegister()"
        style="margin-left:auto"
        [disabled]="!form.valid || form.disabled"
      >
        Register
      </button>

      }
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        width: 300px;
      }
      mat-form-field {
        display: block;
      }
      input.mat-mdc-input-element.mdc-text-field__input {
        font-size: 16px;
        height: 48px;
      }
    `,
  ],
})
export class SupabaseSignInDialogComponent {
  public title = 'Sign In';
  public template: 'signIn' | 'register' = 'signIn';

  errorMatcher = new showErrorAfterInteraction();

  private service: SupabaseService;

  public form = new FormGroup<{ email: FormControl; password: FormControl; passwordConfirm?: FormControl }>({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
  });

  constructor(
    private dialogRef: MatDialogRef<SupabaseSignInDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: ISignInDialogData,
    private notificationService: PicsaNotificationService
  ) {
    this.service = data.service;
  }

  public enableRegisterMode() {
    this.template = 'register';
    this.title = 'Register';
    this.form.addControl('passwordConfirm', new FormControl('', [Validators.required, validatePasswordMatch]));
  }

  public async handleSignIn() {
    this.form.disable();
    const { email, password } = this.form.value;
    const { data, error } = await this.service.signInUser(email, password);
    console.log({ data, error });
    if (error) {
      console.error(error);
      this.notificationService.showUserNotification({ message: error.message, matIcon: 'error' });
      this.form.enable();
    } else {
      this.dialogRef.close();
    }
  }
  public async handleRegister() {
    this.form.disable();
    const { email, password } = this.form.value;
    const { error } = await this.service.signUpUser(email, password);
    if (error) {
      console.error(error);
      this.notificationService.showUserNotification({ message: error.message, matIcon: 'error' });
      this.form.enable();
    } else {
      this.dialogRef.close();
    }
  }
}
