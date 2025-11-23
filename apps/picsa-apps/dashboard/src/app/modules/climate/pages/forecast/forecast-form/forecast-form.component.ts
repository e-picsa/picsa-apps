import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LOCALES_DATA } from '@picsa/data';
import { GEO_LOCATION_DATA, IGelocationData } from '@picsa/data/geoLocation';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { DBToFormBuilderType } from '@picsa/forms';
import { FileDropFile, SupabaseService, SupabaseUploadComponent } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../../../../material.module';
import { ForecastType, IForecastInsert } from '../../../types';

export type IForecastDialogData = {
  country_code: string;
  forecast_type: ForecastType;
};
// id will be populated on upload, location is deprecated (use downscaled_location)
type ForecastFormValue = Omit<IForecastInsert, 'id' | 'location'>;

const [YEAR, MONTH, DAY] = [
  () => new Date().getUTCFullYear(),
  () => new Date().getUTCMonth() + 1,
  () => new Date().getUTCDate(),
];

/** Generate target path for storage file upload depending on forecast type */
const FORECAST_FOLDER_SEGMENT_MAPPING: Record<ForecastType, () => (string | number)[]> = {
  daily: () => ['forecasts', 'daily', YEAR(), MONTH(), DAY()],
  weekly: () => ['forecasts', 'weekly', YEAR(), MONTH(), DAY()],
  downscaled: () => ['forecasts', 'downscaled', YEAR()],
  seasonal: () => ['forecasts', 'seasonal', YEAR()],
};
const FORECAST_FILE_NAME_MAPPING: Record<ForecastType, (file: FileDropFile, value: ForecastFormValue) => string> = {
  daily: (file) => file.name,
  weekly: (file) => file.name,
  downscaled: (file, v) => `${v.downscaled_location}.${v.language_code}.${file.extension}`,
  seasonal: (file, v) => `${v.language_code}.${file.extension}`,
};
const FORECAST_ID_MAPPING: Record<ForecastType, (file: FileDropFile, value: ForecastFormValue) => string> = {
  daily: (file) => `${[YEAR(), MONTH(), DAY()].join()}/${file.name}`,
  weekly: (file) => `${[YEAR(), MONTH(), DAY()].join()}/${file.name}`,
  downscaled: (_, v) => `${YEAR()}/downscaled/${v.downscaled_location}/${v.language_code}`,
  seasonal: (_, v) => `${YEAR()}/seasonal/${v.language_code}`,
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
    label: this.fb.control(null, Validators.required),
    language_code: this.fb.control(null, Validators.required),
    mimetype: this.fb.control(null),
    storage_file: this.fb.control(null, Validators.required),
    downscaled_location: this.fb.control(null),
    // Enums: explicit control allows null start
    forecast_type: this.fb.control({ value: null, disabled: true }, Validators.required),
  });

  /** Return form value if validation satisfied */
  private get validatedValue(): IForecastInsert | null {
    if (this.form.invalid) {
      return null;
    }
    const value = this.form.getRawValue() as ForecastFormValue;
    // id will populate when saving
    return { ...value, id: '' };
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
      this.populateLabel(file);
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
          // populate id and upload to db
          validatedValue.id = FORECAST_ID_MAPPING[this.forecastType](pendingUpload, validatedValue);
          const { error } = await this.supabaseService.db.table('forecasts').insert(validatedValue);
          if (error) {
            await this.supabaseService.storage.deleteFile(this.countryCode, uploadPath);
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
    const storageFolderPath = FORECAST_FOLDER_SEGMENT_MAPPING[this.forecastType]().join('/');
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

  /** Attempt to popualte downscaled location from file name */
  private populateDownscaledLocation(file?: FileDropFile) {
    if (file) {
      const downscaled_location = this.guessDownscaleLocationFromFile(file.name);
      if (downscaled_location && downscaled_location !== this.form.value.downscaled_location) {
        this.form.patchValue({ downscaled_location });
        return;
      }
    }
    if (this.form.value.downscaled_location) {
      this.form.patchValue({ downscaled_location: null });
    }
  }
  private populateLabel(file?: FileDropFile) {
    if (file) {
      // Default label
      let label = `${YEAR()} - ${YEAR() + 1}`;
      if (this.forecastType === 'weekly' || this.forecastType === 'daily') {
        label = `${this.forecastType} Forecast: ${YEAR()}-${MONTH()}-${DAY()}`;
      }
      if (this.form.value.label !== label) {
        this.form.patchValue({ label });
      }
    } else {
      if (this.form.value.label) {
        this.form.patchValue({ label: null });
      }
    }
  }

  /** Look for the name of any known location in the filename  **/
  private guessDownscaleLocationFromFile(filename: string) {
    const fileNameLower = filename.toLowerCase();
    return this.locationOptions().find((v) => fileNameLower.includes(v.id))?.id;
  }

  /** Enable location validators when using downscaled forecast */
  private setLocationValidators(forecastType: IForecastInsert['forecast_type']) {
    const downscaledLocationControl = this.form.controls.downscaled_location;
    if (forecastType === 'downscaled') {
      downscaledLocationControl.setValidators(Validators.required);
    }
  }
}
