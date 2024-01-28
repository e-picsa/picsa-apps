import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Provider } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CROP_ACTIVITY_DATA, CROP_ACTIVITY_HASHMAP, ICropActivityDataEntry } from '@picsa/data';

import { BaseSelectComponent } from '../base/select';

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
})
export class FormCropActivitySelectComponent extends BaseSelectComponent<ICropActivityDataEntry> {
  public override selectOptions = CROP_ACTIVITY_DATA;
  public override selectOptionsHashmap = CROP_ACTIVITY_HASHMAP;

  constructor(cdr: ChangeDetectorRef, public dialog: MatDialog) {
    super(cdr);
  }
}
