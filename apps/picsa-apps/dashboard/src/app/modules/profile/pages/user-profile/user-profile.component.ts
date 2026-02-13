import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { getOrganisationsForCountry, ICountryCode } from '@picsa/data/deployments';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseAuthService } from '@picsa/shared/services/core/supabase/services/supabase-auth.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase/supabase.service';

import { DashboardAuthService } from '../../../auth/services/auth.service';
import { DeploymentItemComponent } from '../../../deployment/components/deployment-item/deployment-item.component';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { ProfileFormComponent } from '../../components/profile-form/profile-form.component';

@Component({
  selector: 'dashboard-user-profile',
  standalone: true,
  imports: [
    DeploymentItemComponent,
    ProfileFormComponent,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent {
  public authService = inject(DashboardAuthService);
  public deploymentService = inject(DeploymentDashboardService);
  private supabase = inject(SupabaseService);
  private supabaseAuthService = inject(SupabaseAuthService);
  private notificationService = inject(PicsaNotificationService);
  private fb = inject(FormBuilder);

  public authRoleLevels = ['editor', 'admin'];
  public authRoleFeatures: string[] = [];

  public emailConfirmed = signal<boolean>(false);

  profileForm = this.fb.group({
    full_name: ['', [Validators.required]],
    country_code: [null as ICountryCode | null, [Validators.required]],
    organisation: ['', [Validators.required]],
    organisation_other: [''],
  });

  constructor() {
    effect(() => {
      const authRoleFeatures: string[] = [];

      const roles = this.authService.authRoles();
      for (const role of roles) {
        const [feature] = role.split('.');
        if (!authRoleFeatures.includes(feature)) authRoleFeatures.push(feature);
      }
      this.authRoleFeatures = authRoleFeatures;
    });

    this.loadProfile();
  }

  async loadProfile() {
    const authUser = this.authService.authUser();
    if (!authUser) return;
    const { email_confirmed_at, id } = authUser;

    this.emailConfirmed.set(email_confirmed_at ? true : false);

    const { data } = await this.supabase.db.table('user_profiles').select('*').eq('user_id', id).single();

    if (data) {
      const profile = data;
      let org = profile.organisation;
      let orgOther = '';

      // Check if org is in the current list.
      // Logic for correctly initializing the form with "Other" if needed.
      const orgs = getOrganisationsForCountry(profile.country_code as ICountryCode);
      const knownOrg = orgs.some((o) => o.id === org);

      if (!knownOrg && org) {
        orgOther = org;
        org = 'OTHER';
      }

      this.profileForm.patchValue({
        full_name: profile.full_name,
        country_code: profile.country_code as ICountryCode,
        organisation: org,
        organisation_other: orgOther,
      });
    }
  }

  async saveProfile() {
    if (this.profileForm.invalid) return;
    this.profileForm.disable();

    const { full_name, country_code, organisation, organisation_other } = this.profileForm.getRawValue();
    const userId = this.authService.authUserId();

    const finalOrganisation = organisation === 'OTHER' ? organisation_other : organisation;

    if (!userId) return;

    const { error } = await this.supabase.db
      .table('user_profiles')
      .update({
        full_name,
        country_code,
        organisation: finalOrganisation,
      })
      .eq('user_id', userId);

    this.profileForm.enable();

    if (error) {
      this.notificationService.showErrorNotification(error.message);
    } else {
      this.notificationService.showSuccessNotification('Profile updated successfully');
    }
  }

  async resendVerificationEmail() {
    const email = this.authService.authUser()?.email;
    if (!email) return;
    const { error } = await this.supabaseAuthService.resendEmailConfirmation(email);
    if (error) {
      this.notificationService.showErrorNotification(error.message);
    } else {
      this.notificationService.showUserNotification({
        message: 'Email sent, please check your inbox and junk folder',
        matIcon: 'mark_email_read',
      });
    }
  }
}
