import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CROPS_DATA, CROPS_DATA_HASHMAP, ICropData } from '@picsa/data';
import { PicsaTranslateModule } from '@picsa/i18n';

import { PicsaFormBaseSelectComponent } from '../base/select';

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
  styleUrls: ['./crop-select.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, PicsaTranslateModule],
})
export class FormCropSelectSingleComponent extends PicsaFormBaseSelectComponent<ICropData> {
  /** Show reset option button with custom text and matIcon */
  public readonly resetOption = input<{ text: string; matIcon: string }>();

  constructor() {
    super();
    this.initBase(CROPS_DATA, CROPS_DATA_HASHMAP);
  }
}
