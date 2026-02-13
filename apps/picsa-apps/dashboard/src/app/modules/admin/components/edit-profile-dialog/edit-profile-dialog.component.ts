import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  COUNTRIES_DATA as COUNTRIES,
  getOrganisationsForCountry,
  ICountryCode,
  IOrganisation,
} from '@picsa/data/deployments';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase/supabase.service';
import { map, startWith } from 'rxjs/operators';

export interface EditProfileDialogData {
  userId: string;
}

@Component({
  selector: 'dashboard-admin-edit-profile-dialog',
  templateUrl: './edit-profile-dialog.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminEditProfileDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private notificationService = inject(PicsaNotificationService);
  public dialogRef = inject(MatDialogRef<AdminEditProfileDialogComponent>);
  public data = inject<EditProfileDialogData>(MAT_DIALOG_DATA);

  countries = COUNTRIES;
  organisations = signal<IOrganisation[]>([]);

  profileForm = this.fb.group({
    full_name: ['', [Validators.required]],
    country_code: [null as ICountryCode | null, [Validators.required]],
    organisation: ['', [Validators.required]],
    organisation_other: [''],
  });

  public showOtherOrgInput = toSignal(
    this.profileForm.controls.organisation.valueChanges.pipe(map((value) => value === 'Other')),
    { initialValue: false },
  );

  constructor() {
    effect(() => {
      if (this.showOtherOrgInput()) {
        this.profileForm.controls.organisation_other.setValidators([Validators.required]);
      } else {
        this.profileForm.controls.organisation_other.clearValidators();
        this.profileForm.controls.organisation_other.setValue('');
      }
      this.profileForm.controls.organisation_other.updateValueAndValidity();
    });

    this.profileForm.controls.country_code.valueChanges
      .pipe(startWith(this.profileForm.controls.country_code.value))
      .subscribe((countryCode) => {
        if (countryCode) {
          this.organisations.set(getOrganisationsForCountry(countryCode));
        } else {
          this.organisations.set([]);
        }
      });
  }

  ngOnInit() {
    this.loadProfile();
  }

  async loadProfile() {
    const { data, error } = await this.supabase.db
      .table('user_profiles' as any)
      .select('*')
      .eq('user_id', this.data.userId)
      .single();

    if (data) {
      const profile = data as any;
      let org = profile.organisation;
      let orgOther = '';

      // Check if org is in the current list. logic slightly complex because list depends on country.
      // We set country first.
      const orgs = getOrganisationsForCountry(profile.country_code as ICountryCode);
      const knownOrg = orgs.some((o) => o.label === org);

      if (!knownOrg && org) {
        orgOther = org;
        org = 'Other';
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
    const finalOrganisation = organisation === 'Other' ? organisation_other : organisation;

    const { error } = await this.supabase.db
      .table('user_profiles' as any)
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
