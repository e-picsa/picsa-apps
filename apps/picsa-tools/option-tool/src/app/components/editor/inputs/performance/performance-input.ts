import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaFormBaseSelectComponent } from '@picsa/forms/components/base/select';
import { PicsaTranslateModule } from '@picsa/i18n';

interface IPerformanceOption {
  label: string;
  /** mat-icon to be used with value select button */
  matIcon: string;
  /** alternative mat-icon to be used in readonly mode */
  readonlyIcon: string;
}

const PERFORMANCE_OPTIONS: { [id: string]: IPerformanceOption } = {
  negative: {
    label: translateMarker('Negative'),
    matIcon: 'thumb_down',
    readonlyIcon: 'sentiment_very_dissatisfied',
  },
  neutral: {
    label: translateMarker('Neutral'),
    matIcon: 'horizontal_rule',
    readonlyIcon: 'sentiment_neutral',
  },
  positive: {
    label: translateMarker('Positive'),
    matIcon: 'thumb_up',
    readonlyIcon: 'sentiment_very_satisfied',
  },
};

const SELECT_OPTIONS = Object.entries(PERFORMANCE_OPTIONS).map(([id, value]) => ({ ...value, id }));

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PicsaTranslateModule],
})
export class PerformanceInputComponent extends PicsaFormBaseSelectComponent<(typeof SELECT_OPTIONS)[0]> {
  /** Configurable display options (none currently used) */
  public readonly options = input<{ readonly?: boolean }>({});

  protected readonly selectedIconValue = computed(() => {
    return this.selectedOption()?.readonlyIcon || '';
  });

  constructor() {
    super();
    this.initBase(SELECT_OPTIONS);
  }
}
