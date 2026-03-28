import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CROPS_DATA, CROPS_DATA_HASHMAP, ICropData } from '@picsa/data';
import { PicsaTranslateModule } from '@picsa/i18n';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatIconModule, PicsaTranslateModule],
})
export class FormCropSelectSingleComponent extends PicsaFormBaseSelectComponent<ICropData> {
  protected isMultiple = false;
  /** Show reset option button with custom text and matIcon */
  public readonly resetOption = input<{ text: string; matIcon: string }>();

  constructor() {
    super();
    this.initBase(CROPS_DATA, CROPS_DATA_HASHMAP);
  }
}

/**
 * Custom input element designed for use with angular Ng-model or standalone syntax
 * @example
 * ```
 * <picsa-form-crop-select-multiple [(ngModel)]="someVariable"></picsa-form-crop-select-multiple>
 * ```
 *
 */
@Component({
  selector: 'picsa-form-crop-select-multiple',
  templateUrl: './crop-select.component.html',
  styleUrls: ['./crop-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatIconModule, PicsaTranslateModule],
})
export class FormCropSelectMultipleComponent extends PicsaFormBaseSelectMultipleComponent<ICropData> {
  protected isMultiple = true;
  /** Show reset option button with custom text and matIcon */
  public readonly resetOption = input<{ text: string; matIcon: string }>();

  constructor() {
    super();
    this.initBase(CROPS_DATA, CROPS_DATA_HASHMAP);
  }

  public handleSelect(id: string) {
    this.toggleSelected(id);
  }
}
