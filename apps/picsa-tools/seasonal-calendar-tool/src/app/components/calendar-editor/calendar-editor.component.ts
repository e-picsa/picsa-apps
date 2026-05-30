import { ChangeDetectionStrategy, Component, computed, effect, input, OnInit, signal, untracked } from '@angular/core';
import { FieldTree, form, FormField, max, min, required } from '@angular/forms/signals'; // Angular 21 Signal Forms
import { MONTH_DATA, MONTH_DATA_HASHMAP } from '@picsa/data';
import { markAllAsTouched, PicsaFormsModule } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/i18n';

import { CalendarDataEntry } from '../../schema';
import { SeasonalCalendarMaterialModule } from '../material.module';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'seasonal-calendar-editor',
  templateUrl: './calendar-editor.component.html',
  styleUrls: ['./calendar-editor.component.scss'],
  imports: [FormField, SeasonalCalendarMaterialModule, PicsaFormsModule, PicsaTranslateModule],
})
export class CalendarEditorComponent implements OnInit {
  public readonly form = input.required<FieldTree<CalendarDataEntry, string | number>>();

  public readonly monthOptions = MONTH_DATA;

  // 2. Define the exact form model state using a standard writable signal
  public readonly monthModel = signal<{ startIndex: number | null; totalCount: number | null }>({
    startIndex: null,
    totalCount: null,
  });

  // 3. Create the typed Signal Form with built-in schema validation
  public readonly monthForm = form(this.monthModel, (path) => {
    required(path.startIndex);
    min(path.startIndex, 0);
    required(path.totalCount);
    min(path.totalCount, 0);
    max(path.totalCount, 24);
  });

  // 4. Computed signal for labels, deriving state purely from the model signal
  public readonly monthLabels = computed(() => {
    const { startIndex, totalCount } = this.monthModel();

    if (startIndex !== null && totalCount !== null) {
      const monthsData = [...MONTH_DATA, ...MONTH_DATA].slice(startIndex, startIndex + totalCount);
      return monthsData.map((m) => m.label);
    }
    return [];
  });

  constructor() {
    // Sync local metadata model to overal form model, populating correct placeholders
    // for weather and activities depending on number of months
    effect(() => {
      const { startIndex, totalCount } = this.monthModel();
      const parentForm = this.form();

      if (startIndex !== null && totalCount !== null) {
        // 1. Calculate the new months array
        const monthsData = [...MONTH_DATA, ...MONTH_DATA].slice(startIndex, startIndex + totalCount);
        const monthIds = monthsData.map((m) => m.id);

        // We use untracked() so reading the parent form's current values
        // doesn't cause this effect to re-run in an infinite loop.
        untracked(() => {
          const currentMeta = parentForm.meta().value();
          const currentWeather = parentForm.weather().value();
          const currentActivities = parentForm.activities().value();

          // 2. Sync Weather Array Length
          const newWeather = Array.from({ length: totalCount }, (_, i) => currentWeather[i] || []);

          // 3. Sync Activities Array Lengths
          const newActivities: Record<string, string[][]> = {};
          for (const heading of currentMeta.enterprises) {
            const existingArray = currentActivities[heading] || [];
            newActivities[heading] = Array.from({ length: totalCount }, (_, i) => existingArray[i] || []);
          }

          // 4. Safely push ALL updates back to the parent Signal Form
          parentForm.meta.months().value.set(monthIds);
          parentForm.weather().value.set(newWeather);
          parentForm.activities().value.set(newActivities);
        });
      }
    });
  }

  public ngOnInit(): void {
    const months = this.form().meta.months().value();
    const [startMonth] = months;

    // Set the initial signal state. The form automatically syncs to this model.
    this.monthModel.set({
      startIndex: startMonth ? MONTH_DATA_HASHMAP[startMonth].index : null,
      totalCount: months.length || null,
    });
  }

  public validate(): boolean {
    markAllAsTouched(this.form());
    markAllAsTouched(this.monthForm);
    // Signal Forms manage state via signals directly.
    // We validate by reading the `valid()` signal computation from the root form.
    return this.form()().valid() && this.monthForm().valid();
  }
}
