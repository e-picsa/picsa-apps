import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, ViewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import {
  COUNTRIES_DATA,
  DEPLOYMENT_DATA,
  ICountryCode,
  IDeploymentId,
  ILanguageCode,
  LANGUAGES_DATA,
} from '@picsa/data';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { ConfigurationService, IUserSettings } from '../../provider';

@Component({
  selector: 'picsa-configuration-select',
  standalone: true,
  imports: [
    CommonModule,
    PicsaTranslateModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      // allow custom stepper icons
      useValue: { displayDefaultIndicatorType: false },
    },
  ],
  templateUrl: './configuration-select.component.html',
  styleUrl: './configuration-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicsaConfigurationSelectComponent {
  // mat-stepper prefers individual forms per step
  public countryForm = this.fb.group({
    country_code: new FormControl<IUserSettings['country_code']>(null as any, {
      validators: Validators.required,
      nonNullable: true,
    }),
  });
  public languageForm = this.fb.group({
    language_code: new FormControl<IUserSettings['language_code']>(null as any, {
      validators: Validators.required,
      nonNullable: true,
    }),
  });
  public userTypeForm = this.fb.group({
    user_type: new FormControl<IUserSettings['user_type']>(null as any, {
      validators: Validators.required,
      nonNullable: true,
    }),
  });

  public countryOptions = COUNTRIES_DATA;

  // Create a signal from country form to allow computed list of languages to be generated
  private countrySelected = toSignal<ICountryCode>(this.countryForm.controls.country_code.valueChanges);

  public languageOptions = computed(() => {
    const country_code = this.countrySelected();
    if (country_code === 'global') {
      return LANGUAGES_DATA;
    }
    return LANGUAGES_DATA.filter((o) => o.country_code === 'global' || o.country_code === country_code);
  });

  public userTypeOptions = [
    {
      id: 'farmer',
      label: "I'm a farmer",
    },
    {
      id: 'extension',
      label: "I'm an extension worker",
    },
  ] as const;

  @ViewChild(MatStepper) stepper: MatStepper;

  constructor(private fb: FormBuilder, private configurationService: ConfigurationService) {}
  public setCountry(country_code: ICountryCode) {
    this.countryForm.patchValue({ country_code });
    this.configurationService.updateUserSettings({ country_code });
    this.goToNextStep();
  }

  public setLanguage(language_code: ILanguageCode) {
    this.languageForm.patchValue({ language_code });
    this.configurationService.updateUserSettings({ language_code });
    this.goToNextStep();
  }
  public setUserType(user_type: IUserSettings['user_type']) {
    this.userTypeForm.patchValue({ user_type });
    this.loadDeploymentFromSelections();
  }

  private goToNextStep() {
    // advance stepper to next section after short delay
    setTimeout(() => {
      this.stepper.next();
    }, 1000);
  }

  /**
   * Language and user type combinations should uniquely identify a deployment configuration
   * Load the full deployment configuration if available
   * NOTE - In the future method could be extended to present a 3rd onboarding menu if required
   */
  private loadDeploymentFromSelections() {
    const { user_type } = this.userTypeForm.value;
    const { country_code } = this.countryForm.value;
    if (user_type && country_code) {
      const matchedDeployments = DEPLOYMENT_DATA.filter((d) => d.country_code === country_code);
      if (matchedDeployments.length === 1) {
        // trigger configuration service update after small delay (will handle home screen change)
        setTimeout(() => {
          this.saveFormValues(matchedDeployments[0].id);
        }, 1000);
      } else {
        // HACK - assume global deployment if none matched
        this.saveFormValues('global');
      }
    }
  }

  /**
   * Save form values to configuration service
   */
  private saveFormValues(deployment_id: IDeploymentId) {
    this.configurationService.updateUserSettings({
      language_code: this.languageForm.value.language_code,
      user_type: this.userTypeForm.value.user_type,
      deployment_id,
    });
  }
}
