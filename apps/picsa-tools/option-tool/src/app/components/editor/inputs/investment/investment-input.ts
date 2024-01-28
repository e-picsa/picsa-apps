import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input, Provider } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaFormBaseSelectComponent } from '@picsa/shared/modules/forms/components/base/select';

interface IInvestmentOption {
  label: string;
  /** mat-icon to be used with value select button */
  matIcon: string;
}

const INVESTMENT_OPTIONS: { [id: string]: IInvestmentOption } = {
  low: {
    label: translateMarker('Low'),
    matIcon: 'arrow_downward',
  },
  medium: {
    label: translateMarker('Medium'),
    matIcon: 'horizontal_rule',
  },
  high: {
    label: translateMarker('High'),
    matIcon: 'arrow_upward',
  },
};

const SELECT_OPTIONS = Object.entries(INVESTMENT_OPTIONS).map(([id, value]) => ({ ...value, id }));

/** Accessor used for binding with ngModel or formgroups */
export const INVESTMENT_INPUT_CONTROL_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => InvestmentInputComponent),
  multi: true,
};

/**
 * Custom input element designed for use with angular Ng-model or standalone syntax
 * @example
 * ```
 * <option-investment-input [(ngModel)]="someVariable"></option-gender-input>
 * ```
 */
@Component({
  selector: 'option-investment-input',
  templateUrl: './investment-input.html',
  styleUrls: ['./investment-input.scss'],
  providers: [INVESTMENT_INPUT_CONTROL_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentInputComponent extends PicsaFormBaseSelectComponent<IInvestmentOption> {
  public override selectOptions = SELECT_OPTIONS;

  /** Configurable display options (none currently used) */
  @Input() options: { readonly?: boolean } = {};

  constructor(cdr: ChangeDetectorRef) {
    super(cdr);
  }
}
