import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  COUNTRIES_DATA as COUNTRIES,
  getOrganisationsForCountry,
  ICountryCode,
  IOrganisation,
} from '@picsa/data/deployments';
import { startWith, Subscription } from 'rxjs';

@Component({
  selector: 'dashboard-profile-form',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './profile-form.component.html',
  styleUrls: ['./profile-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileFormComponent {
  public formGroup = input.required<FormGroup>();
  public showFullName = input(true);
  public showProfessionalDetails = input(true);

  public countries = COUNTRIES;
  public organisations = signal<IOrganisation[]>([]);
  public showOtherOrgInput = signal(false);

  constructor() {
    effect((onCleanup) => {
      // Re-subscribe whenever formGroup changes
      const form = this.formGroup();
      if (!form) return;

      const sub = new Subscription();

      // Logic for Country -> Organisations
      const countryControl = form.get('country_code');
      if (countryControl) {
        sub.add(
          countryControl.valueChanges.pipe(startWith(countryControl.value)).subscribe((countryCode: ICountryCode) => {
            if (countryCode) {
              this.organisations.set(getOrganisationsForCountry(countryCode));
            } else {
              this.organisations.set([]);
            }
          }),
        );
      }

      // Logic for Organisation -> Other Input Visibility & Validation
      const orgControl = form.get('organisation');
      const otherOrgControl = form.get('organisation_other');

      if (orgControl && otherOrgControl) {
        sub.add(
          orgControl.valueChanges.pipe(startWith(orgControl.value)).subscribe((value: string) => {
            const showOther = value === 'OTHER';
            this.showOtherOrgInput.set(showOther);

            if (showOther) {
              otherOrgControl.setValidators([Validators.required]);
            } else {
              otherOrgControl.clearValidators();
              otherOrgControl.setValue('');
            }
            otherOrgControl.updateValueAndValidity({ emitEvent: false });
          }),
        );
      }

      onCleanup(() => {
        sub.unsubscribe();
      });
    });
  }
}
