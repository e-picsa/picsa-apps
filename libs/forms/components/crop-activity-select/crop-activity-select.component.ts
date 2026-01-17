import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Provider } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CROP_ACTIVITY_DATA, CROP_ACTIVITY_HASHMAP, ICropActivityDataEntry } from '@picsa/data';

import { PicsaFormBaseSelectComponent } from '../base/select';

/** Accessor used for binding with ngModel or formgroups */
export const CONTROL_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FormCropActivitySelectComponent),
  multi: true,
};

/**
 * Form control to allow visual selection of crop-activity condition
 * Displays options in a popup and allows single selection
 */
@Component({
  selector: 'picsa-form-crop-activity-select',
  templateUrl: './crop-activity-select.component.html',
  styleUrls: ['./crop-activity-select.component.scss'],
  providers: [CONTROL_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FormCropActivitySelectComponent extends PicsaFormBaseSelectComponent<ICropActivityDataEntry> {
  constructor(
    cdr: ChangeDetectorRef,
    public dialog: MatDialog,
  ) {
    super(cdr, CROP_ACTIVITY_DATA, CROP_ACTIVITY_HASHMAP);
  }
}
