import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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

export class showErrorAfterInteraction implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'dashboard-password-reset.',
  standalone: true,
  imports:  [CommonModule, FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.scss',
})
export class PasswordResetComponent {

  public form = new FormGroup<{ password: FormControl; confirmPassword?: FormControl }>({
    confirmPassword: new FormControl('', [Validators.required]),
    password: new FormControl('', Validators.required),
  });
 
  // constructor(public authService: DashboardAuthService, public deploymentService: DeploymentDashboardService) {
  //   effect(() => {
  //     const authRoleFeatures: string[] = [];

  //     const roles = this.authService.authRoles();
  //     for (const role of roles) {
  //       const [feature, level] = role.split('.');
  //       if (!authRoleFeatures.includes(feature)) authRoleFeatures.push(feature);
  //     }
  //     this.authRoleFeatures = authRoleFeatures;
  //   });
  // }
}
