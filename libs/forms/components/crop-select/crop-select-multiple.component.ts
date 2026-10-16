import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CROPS_DATA, ICropData } from '@picsa/data';
import { PicsaTranslateModule } from '@picsa/i18n';
import { arrayToHashmap } from '@picsa/utils';

import { PicsaFormBaseSelectMultipleComponent } from '../base/select-multiple';

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
  templateUrl: './crop-select-multiple.component.html',
  styleUrls: ['./crop-select.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, PicsaTranslateModule],
})
export class FormCropSelectMultipleComponent extends PicsaFormBaseSelectMultipleComponent<ICropData> {
  /** Show reset option button with custom text and matIcon */
  public readonly resetOption = input<{ text: string; matIcon: string }>();

  public readonly customOptions = input<ICropData[]>([]);
  public readonly addCustomOption = input<{ text: string; matIcon: string }>();
  public readonly addCustomClicked = output<void>();

  constructor() {
    super();
    effect(() => {
      const options = [...CROPS_DATA, ...this.customOptions()];
      this.setSelectOptions(options, arrayToHashmap(options, 'name'));
    });
  }

  public handleSelect(id: string) {
    this.toggleSelected(id);
  }
}
