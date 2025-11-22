import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LOCALES_DATA } from '@picsa/data';
import { GEO_LOCATION_DATA, IGelocationData } from '@picsa/data/geoLocation';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { DBToFormBuilderType } from '@picsa/forms';
import { FileDropFile, SupabaseService, SupabaseUploadComponent } from '@picsa/shared/services/core/supabase';
import { map } from 'rxjs';

import { DashboardMaterialModule } from '../../../../../material.module';
import { ForecastType, IForecastInsert } from '../../../types';

export type IForecastDialogData = {
  country_code: string;
  forecast_type: ForecastType;
};
type ForecastFormValue = Omit<IForecastInsert, 'id'>;

/** Generate target path for storage file upload depending on forecast type */
const FORECAST_FOLDER_SEGMENT_MAPPING: Record<ForecastType, (d: Date) => (string | number)[]> = {
  daily: (d) => ['forecasts', 'daily', d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()],
  weekly: (d) => ['forecasts', 'weekly', d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()],
  downscaled: (d) => ['forecasts', 'downscaled', d.getUTCFullYear()],
  seasonal: (d) => ['forecasts', 'seasonal', d.getUTCFullYear()],
};
const FORECAST_FILE_NAME_MAPPING: Record<ForecastType, (file: FileDropFile, value: ForecastFormValue) => string> = {
  daily: (file) => file.name,
  weekly: (file) => file.name,
  downscaled: (file, value) => `${value.location}_${value.language_code}.${file.extension}`,
  seasonal: (file, value) => `${value.location}_${value.language_code}.${file.extension}`,
};
const FORECAST_ID_MAPPING: Record<ForecastType, (file: FileDropFile, value: ForecastFormValue) => string> = {
  daily: (file) => `${new Date().toISOString().slice(0, 8)}/${file.name}`,
  weekly: (file) => `${new Date().toISOString().slice(0, 8)}/${file.name}`,
  downscaled: (_, value) => `${new Date().getFullYear()}/${value.location}_${value.language_code}`,
  seasonal: (_, value) => `${new Date().getFullYear()}/${value.location}_${value.language_code}`,
};

@Component({
  selector: 'dashboard-climate-forecast-form',
  imports: [CommonModule, ReactiveFormsModule, DashboardMaterialModule, SupabaseUploadComponent],
  templateUrl: './forecast-form.component.html',
  styleUrl: './forecast-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForecastFormComponent {
  private dialogRef = inject(MatDialogRef<ForecastFormComponent>);
  private fb = inject(FormBuilder);
  private initialValues = inject<IForecastDialogData>(MAT_DIALOG_DATA);
  private supabaseService = inject(SupabaseService);

  private pendingFileUpload = signal<FileDropFile | undefined>(undefined);

  public countryCode = this.initialValues.country_code;
  public forecastType = this.initialValues.forecast_type;

  public languageOptions = computed(() =>
    LOCALES_DATA.filter((v) => v.country_code === this.initialValues.country_code),
  );
  public locationOptions = computed(() => {
    const { country_code } = this.initialValues;
    const locationData = GEO_LOCATION_DATA[country_code] as IGelocationData;
    return locationData?.admin_5?.locations || locationData?.admin_4?.locations || [];
  });

  // 2. Pass the type to fb.group<T> to enforce strict matching immediately
  public form = this.fb.group<DBToFormBuilderType<ForecastFormValue>>({
    country_code: this.fb.nonNullable.control(null, Validators.required),
    label: this.fb.control(null),
    language_code: this.fb.control(null, Validators.required),
    mimetype: this.fb.control(null),
    storage_file: this.fb.control(null, Validators.required),
    location: this.fb.control(null),

    // Enums: explicit control allows null start
    forecast_type: this.fb.control({ value: null, disabled: true }, Validators.required),
  });

  /** Return form value if validation satisfied */
  private get validatedValue(): IForecastInsert | null {
    if (this.form.invalid) {
      return null;
    }
    const value = this.form.getRawValue() as ForecastFormValue;

    return { ...value, id: value.storage_file as string };
  }

  constructor() {
    this.setLocationValidators(this.forecastType);
    this.form.patchValue(this.initialValues);

    // Optimistically set storage path for file uploads
    effect(() => {
      const file = this.pendingFileUpload();
      if (file) {
        if (!this.form.value.storage_file) {
          this.form.patchValue({ storage_file: '_pending' });
        }
      } else {
        if (this.form.value.storage_file) {
          this.form.patchValue({ storage_file: null });
        }
      }
    });
    // Attempt to populate downscaled location on file upload
    effect(() => {
      const file = this.pendingFileUpload();
      if (this.forecastType === 'downscaled') {
        this.populateDownscaledLocation(file);
      }
    });
  }

  public async save(fileUploadRef: SupabaseUploadComponent) {
    const validatedValue = this.validatedValue;
    const pendingUpload = this.pendingFileUpload();
    if (validatedValue && pendingUpload) {
      this.form.disable();
      try {
        const uploadPath = await this.handleForecastFileUpload(fileUploadRef, pendingUpload, validatedValue);
        if (uploadPath) {
          validatedValue.storage_file = uploadPath;
          validatedValue.mimetype = 'application/pdf';
          const { error } = await this.handleDBUpdate(pendingUpload, validatedValue);
          if (error) {
            console.error(error);
            // TODO - rollback file upload?
            throw error;
          }
          this.dialogRef.close(this.validatedValue);
        }
      } catch (error) {
        this.form.enable();
        throw error;
      }
    }
  }

  handleFileDropped(file?: FileDropFile) {
    this.pendingFileUpload.set(file);
  }

  private async handleForecastFileUpload(
    ref: SupabaseUploadComponent,
    file: FileDropFile,
    formValue: ForecastFormValue,
  ) {
    // map pending upload file to correct folder and filename
    const storageFolderPath = FORECAST_FOLDER_SEGMENT_MAPPING[this.forecastType](new Date()).join('/');
    const storageFileName = FORECAST_FILE_NAME_MAPPING[this.forecastType](file, formValue);
    const bucketName = this.countryCode;
    ref.storageBucketName = bucketName;
    ref.storageFolderPath = storageFolderPath;
    ref.renameFile(file.name, storageFileName);
    // handle upload
    const { failed, successful } = await ref.startUpload();
    if (successful.length === 1) {
      // return fully qualified path to uploaded file
      return `${bucketName}/${storageFolderPath}/${storageFileName}`;
    } else {
      console.error({ successful, failed });
      throw new Error(`Storage file upload failed`);
    }
  }

  private async handleDBUpdate(file: FileDropFile, formValues: ForecastFormValue) {
    const id = FORECAST_ID_MAPPING[this.forecastType](file, formValues);
    return this.supabaseService.db.table('forecasts').insert({ ...formValues, id });
  }

  /** Attempt to popualte downscaled location from file name */
  private populateDownscaledLocation(file?: FileDropFile) {
    if (file) {
      const location = this.guessDownscaleLocationFromFile(file.name);
      if (location && location !== this.form.value.location) {
        this.form.patchValue({ location });
        return;
      }
    }
    if (this.form.value.location) {
      this.form.patchValue({ location: null });
    }
  }

  /** Look for the name of any known location in the filename  **/
  private guessDownscaleLocationFromFile(filename: string) {
    const fileNameLower = filename.toLowerCase();
    return this.locationOptions().find((v) => fileNameLower.includes(v.id))?.id;
  }

  /** Enable location validators when using downscaled forecast */
  private setLocationValidators(forecastType: IForecastInsert['forecast_type']) {
    const locationCtrl = this.form.controls.location;
    if (forecastType === 'downscaled') {
      locationCtrl.setValidators(Validators.required);
    }
  }
}
