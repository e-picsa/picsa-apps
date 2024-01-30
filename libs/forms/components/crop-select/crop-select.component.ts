import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input, Provider } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CROPS_DATA, CROPS_DATA_HASHMAP, ICropData } from '@picsa/data';

import { PicsaFormBaseSelectComponent } from '../base/select';
import { PicsaFormBaseSelectMultipleComponent } from '../base/select-multiple';

/**
 * Separate components to allow single and multiple crop select
 *
 * TODO
 * - Add support for custom crop lists/filter
 * - Replace crop-probability-tool select with shared component
 * - Support custom crop
 */

// Single Select
export const CROP_SELECT_SINGLE_INPUT_CONTROL_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FormCropSelectSingleComponent),
  multi: true,
};
@Component({
  selector: 'picsa-form-crop-select',
  templateUrl: './crop-select.component.html',
  styleUrls: ['./crop-select.component.scss'],
  providers: [CROP_SELECT_SINGLE_INPUT_CONTROL_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormCropSelectSingleComponent extends PicsaFormBaseSelectComponent<ICropData> {
  protected isMultiple = false;
  /** Show reset option button with custom text and matIcon */
  @Input() resetOption: { text: 'Show All'; matIcon: 'apps' };
  constructor(cdr: ChangeDetectorRef) {
    super(cdr, CROPS_DATA, CROPS_DATA_HASHMAP);
  }
  public handleSelect(id: string) {
    this.selected = id;
  }
  public handleReset() {
    this.selected = '';
  }
}

// Multiple Select
export const CROP_SELECT_MULTIPLE_INPUT_CONTROL_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FormCropSelectMultipleComponent),
  multi: true,
};

/**
 * Custom input element designed for use with angular Ng-model or standalone syntax
 * @example
 * ```
 * <picsa-form-crop-select-multiple [(ngModel)]="someVariable"></picsa-form-crop-select-multiple>
 * ```

 */
@Component({
  selector: 'picsa-form-crop-select-multiple',
  templateUrl: './crop-select.component.html',
  styleUrls: ['./crop-select.component.scss'],
  providers: [CROP_SELECT_MULTIPLE_INPUT_CONTROL_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormCropSelectMultipleComponent extends PicsaFormBaseSelectMultipleComponent<ICropData> {
  protected isMultiple = true;
  /** Show reset option button with custom text and matIcon */
  public resetOption: { text: string; matIcon: string };
  constructor(cdr: ChangeDetectorRef) {
    super(cdr, CROPS_DATA, CROPS_DATA_HASHMAP);
  }
  public handleSelect(id: string) {
    this.toggleSelected(id);
  }
  public handleReset() {
    this.selected = [];
  }
}
