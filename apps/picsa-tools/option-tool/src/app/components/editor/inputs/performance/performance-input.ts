import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input, Provider } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaFormBaseSelectComponent } from '@picsa/forms/components/base/select';

interface IPerformanceOption {
  label: string;
  /** mat-icon to be used with value select button */
  matIcon: string;
  /** alternative mat-icon to be used in readonly mode */
  readonlyIcon: string;
}

const PERFORMANCE_OPTIONS: { [id: string]: IPerformanceOption } = {
  bad: {
    label: translateMarker('Bad'),
    matIcon: 'cancel',
    readonlyIcon: 'close',
  },
  neutral: {
    label: translateMarker('Neutral'),
    matIcon: 'do_not_disturb_on',
    readonlyIcon: 'horizontal_rule',
  },
  good: {
    label: translateMarker('Good'),
    matIcon: 'check_circle',
    readonlyIcon: 'check',
  },
};
const SELECT_OPTIONS = Object.entries(PERFORMANCE_OPTIONS).map(([id, value]) => ({ ...value, id }));

/** Accessor used for binding with ngModel or formgroups */
export const PERFORMANCE_INPUT_CONTROL_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => PerformanceInputComponent),
  multi: true,
};

/**
 * Custom input element designed for use with angular Ng-model or standalone syntax
 * @example
 * ```
 * <option-performance-input [(ngModel)]="someVariable"></option-gender-input>
 * ```
 */
@Component({
  selector: 'option-performance-input',
  templateUrl: './performance-input.html',
  styleUrls: ['./performance-input.scss'],
  providers: [PERFORMANCE_INPUT_CONTROL_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PerformanceInputComponent extends PicsaFormBaseSelectComponent<typeof SELECT_OPTIONS[0]> {
  /** Configurable display options (none currently used) */
  @Input() options: { readonly?: boolean } = {};

  protected get selectedIconValue() {
    return this.selectedOption?.readonlyIcon || '';
  }

  constructor(cdr: ChangeDetectorRef) {
    super(cdr, SELECT_OPTIONS);
  }
}
