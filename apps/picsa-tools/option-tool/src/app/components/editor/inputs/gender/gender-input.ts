import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaFormBaseSelectMultipleComponent } from '@picsa/forms/components/base/select-multiple';
import { PicsaTranslateModule } from '@picsa/i18n';

const GENDER_OPTIONS: { [id: string]: { label: string; svgIcon: string } } = {
  female: {
    label: translateMarker('Female'),
    svgIcon: 'options_tool:female',
  },
  male: {
    label: translateMarker('Male'),
    svgIcon: 'options_tool:male',
  },
};

/** Mark additional hardcoded strings for translation */
const STRINGS = { only: translateMarker('Only'), and: translateMarker('and'), both: translateMarker('Both') };

const SELECT_OPTIONS = Object.entries(GENDER_OPTIONS).map(([id, value]) => ({ ...value, id }));

/**
 * Custom input element designed for use with angular Ng-model or standalone syntax
 * @example
 * ```
 * <option-gender-input [formField]="someVariable"></option-gender-input>
 * ```
 */
@Component({
  selector: 'option-gender-input',
  templateUrl: './gender-input.html',
  styleUrls: ['./gender-input.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PicsaTranslateModule],
})
export class GenderInputComponent extends PicsaFormBaseSelectMultipleComponent<(typeof SELECT_OPTIONS)[0]> {
  /** Configurable display options */
  public readonly options = input<{ showValueText?: boolean; readonly?: boolean }>({});

  constructor() {
    super();
    this.initBase(SELECT_OPTIONS);
  }

  /**
   * Return a text representation of the value. Returns an array or individual words for easier translation
   * In case one gender selected will return ['Only', 'Female']
   * In case both selected will return ['Both']
   */
  public readonly valueTextArray = computed(() => {
    const selectedVals = this.value() || [];
    if (selectedVals.length === 0) return [];
    if (selectedVals.length === 2) return [STRINGS.both];
    const [selectedId] = selectedVals;
    return [STRINGS.only, GENDER_OPTIONS[selectedId]?.label || ''];
  });
}
