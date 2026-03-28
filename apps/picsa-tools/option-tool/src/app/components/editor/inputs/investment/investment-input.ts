import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaFormBaseSelectComponent } from '@picsa/forms/components/base/select';
import { PicsaTranslateModule } from '@picsa/i18n';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PicsaTranslateModule],
})
export class InvestmentInputComponent extends PicsaFormBaseSelectComponent<(typeof SELECT_OPTIONS)[0]> {
  /** Configurable display options (none currently used) */
  public readonly options = input<{ readonly?: boolean }>({});

  constructor() {
    super();
    this.initBase(SELECT_OPTIONS);
  }
}
