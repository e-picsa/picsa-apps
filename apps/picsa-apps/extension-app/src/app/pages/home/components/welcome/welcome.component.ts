import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { CommonModule } from '@angular/common';
import { Component, effect, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { ConfigurationService, IUserSettings } from '@picsa/configuration/src';
import { ILanguageDataEntry, LANGUAGES_DATA } from '@picsa/data';
import { PicsaTranslateModule } from '@picsa/shared/modules';

@Component({
  selector: 'picsa-welcome',
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
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
})
export class PicsaWelcomeComponent {
  public languageOptions = LANGUAGES_DATA;
  // mat-stepper prefers individual forms per step
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

  @ViewChild(MatStepper) stepper: MatStepper;

  constructor(private fb: FormBuilder, private configurationService: ConfigurationService) {
    effect(() => {
      const { language_code, user_type } = configurationService.userSettings();
      this.languageForm.patchValue({ language_code });
      this.userTypeForm.patchValue({ user_type });
    });
  }

  public setLanguage(option: ILanguageDataEntry) {
    this.languageForm.patchValue({ language_code: option.id });
    // advance stepper to next section after short delay
    setTimeout(() => {
      this.stepper.next();
    }, 1000);
  }
  public setUserType(user_type: IUserSettings['user_type']) {
    this.userTypeForm.patchValue({ user_type });
    // trigger configuration service update after small delay (will handle home screen change)
    setTimeout(() => {
      this.configurationService.updateUserSettings({
        language_code: this.languageForm.value.language_code,
        user_type: this.userTypeForm.value.user_type,
      });
    }, 1000);
  }
}
