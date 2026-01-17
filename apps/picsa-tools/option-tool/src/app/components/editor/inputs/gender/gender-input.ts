import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input, Provider } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaFormBaseSelectMultipleComponent } from '@picsa/forms/components/base/select-multiple';

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

/** Accessor used for binding with ngModel or formgroups */
export const GENDER_INPUT_CONTROL_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => GenderInputComponent),
  multi: true,
};

/**
 * Custom input element designed for use with angular Ng-model or standalone syntax
 * @example
 * ```
 * <option-gender-input [(ngModel)]="someVariable"></option-gender-input>
 * ```
 */
@Component({
  selector: 'option-gender-input',
  templateUrl: './gender-input.html',
  styleUrls: ['./gender-input.scss'],
  providers: [GENDER_INPUT_CONTROL_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class GenderInputComponent extends PicsaFormBaseSelectMultipleComponent<(typeof SELECT_OPTIONS)[0]> {
  // public override selectOptions = SELECT_OPTIONS;

  /** Configurable display options */
  @Input() options: { showValueText?: boolean; readonly?: boolean } = {};

  constructor(cdr: ChangeDetectorRef) {
    super(cdr, SELECT_OPTIONS);
  }

  /**
   * Return a text representation of the value. Returns an array or individual words for easier translation
   * In case one gender selected will return ['Only', 'Female']
   * In case both selected will return ['Both']
   */
  public get valueTextArray() {
    if (this.selected.length == 0) return [];
    if (this.selected.length === 2) return [STRINGS.both];
    const [selectedId] = this.selected;
    return [STRINGS.only, GENDER_OPTIONS[selectedId].label];
  }
}
