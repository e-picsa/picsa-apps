import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
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

@Component({
  selector: 'picsa-form-crop-select',
  templateUrl: './crop-select.component.html',
  styleUrls: ['./crop-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormCropSelectSingleComponent),
      multi: true,
    },
    {
      provide: MatFormFieldControl,
      useExisting: FormCropSelectSingleComponent,
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormCropSelectMultipleComponent),
      multi: true,
    },
    {
      provide: MatFormFieldControl,
      useExisting: FormCropSelectMultipleComponent,
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
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
