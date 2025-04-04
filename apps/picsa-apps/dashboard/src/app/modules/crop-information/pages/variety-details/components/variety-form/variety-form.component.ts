import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CROPS_DATA } from '@picsa/data';
import { PICSAFormValidators } from '@picsa/forms';

import { DashboardMaterialModule } from '../../../../../../material.module';
import { ICropData } from '../../../../services';

@Component({
  selector: 'dashboard-crop-variety-form',
  imports: [CommonModule, DashboardMaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './variety-form.component.html',
  styleUrl: './variety-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardCropVarietyFormComponent {
  public initialValue = input<ICropData['Insert'] | undefined>(undefined);

  public form = this.formBuilder.nonNullable.group({
    id: new FormControl(), // populated by server or on edit
    crop: ['', Validators.required],
    variety: ['', Validators.required],
    maturity_period: ['', Validators.required],
    days_lower: [0, PICSAFormValidators.minMax(1, 1000)],
    days_upper: [0, PICSAFormValidators.minMax(1, 1000)],
    additional_info: new FormControl<string | null>(null),
  });

  public cropOptions = CROPS_DATA.map(({ id, label }) => ({ id, label }));

  private varietyValue = toSignal(this.form.controls.variety.valueChanges);

  constructor(private formBuilder: FormBuilder) {
    effect(() => {
      const value = this.initialValue();
      // avoid crop type or variety change after entry created as wil change id
      if (value) {
        this.form.controls.crop.disable();
        this.form.controls.variety.disable();
        this.form.patchValue(value);
      }
    });

    effect(() => {
      // Enforce variety name to be upper case with only alphanumeric and dash
      const variety = this.varietyValue();
      const cleanedValue = variety?.toUpperCase().replace(/[^0-9a-z-]/gi, '-');
      if (variety !== cleanedValue) {
        this.form.patchValue({ variety: cleanedValue }, { emitEvent: true });
      }
    });
  }

  /** Utility method, retained to ensure rawValue corresponds to expected CaledarDataEntry type */
  public get value() {
    const entry: ICropData['Insert'] = this.form.getRawValue();
    return entry;
  }
}
