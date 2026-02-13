import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { getOrganisationsForCountry, ICountryCode } from '@picsa/data/deployments';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase/supabase.service';

import { ProfileFormComponent } from '../../../profile/components/profile-form/profile-form.component';

export interface EditProfileDialogData {
  userId: string;
}

@Component({
  selector: 'dashboard-admin-edit-profile-dialog',
  templateUrl: './edit-profile-dialog.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, ProfileFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminEditProfileDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private notificationService = inject(PicsaNotificationService);
  public dialogRef = inject(MatDialogRef<AdminEditProfileDialogComponent>);
  public data = inject<EditProfileDialogData>(MAT_DIALOG_DATA);

  profileForm = this.fb.group({
    full_name: ['', [Validators.required]],
    country_code: [null as ICountryCode | null, [Validators.required]],
    organisation: ['', [Validators.required]],
    organisation_other: [''],
  });

  ngOnInit() {
    this.loadProfile();
  }

  async loadProfile() {
    const { data: profile } = await this.supabase.db
      .table('user_profiles')
      .select('*')
      .eq('user_id', this.data.userId)
      .single();

    if (profile) {
      const userProfile = profile;
      let org = userProfile.organisation;
      let orgOther = '';

      // Check if org is in the current list.
      const orgs = getOrganisationsForCountry(userProfile.country_code as string);
      const knownOrg = orgs.some((o) => o.id === org);

      if (!knownOrg && org) {
        orgOther = org;
        org = 'OTHER';
      }

      this.profileForm.patchValue({
        full_name: userProfile.full_name,
        country_code: userProfile.country_code as ICountryCode,
        organisation: org,
        organisation_other: orgOther,
      });
    }
  }

  async saveProfile() {
    if (this.profileForm.invalid) return;
    this.profileForm.disable();

    const { full_name, country_code, organisation, organisation_other } = this.profileForm.getRawValue();
    const finalOrganisation = organisation === 'OTHER' ? organisation_other : organisation;

    const { error } = await this.supabase.db
      .table('user_profiles')
      .update({
        full_name,
        country_code,
        organisation: finalOrganisation,
      })
      .eq('user_id', this.data.userId);

    this.profileForm.enable();

    if (error) {
      this.notificationService.showErrorNotification(error.message);
    } else {
      this.notificationService.showSuccessNotification('Profile updated successfully');
      this.dialogRef.close(true);
    }
  }
}
