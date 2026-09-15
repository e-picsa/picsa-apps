import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField } from '@angular/forms/signals';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CROPS_DATA, ICropActivityDataEntry, MONTH_DATA_HASHMAP } from '@picsa/data';
import { FormCropActivitySelectMultipleComponent } from '@picsa/forms/components/crop-activity-select/crop-activity-select-multiple.component';
import { FormWeatherSelectMultipleComponent } from '@picsa/forms/components/weather-select/weather-select-multiple.component';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PicsaLoadingComponent } from '@picsa/shared/features/loading/loading';
import { arrayToHashmap } from '@picsa/utils';
import { debouncedEffect } from '@picsa/utils/angular';
import { _wait } from '@picsa/utils/browser.utils';
import { isEqual } from '@picsa/utils/object.utils';

import { CalendarEditorComponent } from '../../components/calendar-editor/calendar-editor.component';
import { SeasonalCalendarCardNewDialogComponent } from '../../components/card-new-dialog/card-new-dialog.component';
import { SeasonalCalendarMaterialModule } from '../../components/material.module';
import { ICalendarCard } from '../../schema/cards';
import { createForm } from '../../schema/form';
import { SeasonCalendarService } from '../../services/calendar.data.service';
import { SeasonalCalendarCardService } from '../../services/calendar-card.service';

/** Adapt a drawn custom card to the shape the shared crop-activity-select component renders */
function toActivityOption(card: ICalendarCard): ICropActivityDataEntry {
  return {
    id: card.id,
    label: card.label,
    assetIconPath: card.customMeta?.imgData ?? '',
    svgIcon: '',
  } as ICropActivityDataEntry;
}

@Component({
  selector: 'seasonal-calendar-table',
  templateUrl: './calendar-table.component.html',
  styleUrls: ['./calendar-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    SeasonalCalendarMaterialModule,
    FormWeatherSelectMultipleComponent,
    FormCropActivitySelectMultipleComponent,
    CalendarEditorComponent,
    PicsaTranslateModule,
    PicsaLoadingComponent,
  ],
})
export class CalendarTableComponent {
  /**
   * Provider from router via `provideRouter(routes, withComponentInputBinding())`
   * or `RouterModule.forRoot(routes, { bindToComponentInputs: true })`
   */
  public calendarId = input<string>();

  private router = inject(Router);
  private service = inject(SeasonCalendarService);
  private cardService = inject(SeasonalCalendarCardService);
  private destroyRef = inject(DestroyRef);

  dialog = inject(MatDialog);

  public readonly customActivities = signal<ICropActivityDataEntry[]>([]);

  /** Toggle whether to enable editing features (names and crops) */
  public editMode = signal(false);

  public dbLoaded = signal(false);

  private formState = createForm();

  public form = this.formState.form;
  public model = this.formState.model;

  // Generate column labels from the populated form months
  private formMonths = computed(() => this.form.meta.months().value(), { equal: isEqual });
  public columnLabels = computed(() => this.formMonths().map((month) => MONTH_DATA_HASHMAP[month]?.label));

  // Generate row labels from names of crops
  private formEnterprises = computed(() => this.form.meta.enterprises().value(), { equal: isEqual });
  public rowLabels = computed(() => this.formEnterprises().map((crop) => this.cropsByName[crop]?.label));

  public shareStatus = signal('share');
  public shareDisabled = signal(false);

  /** Lookup for crop labels displayed in table rows */
  private readonly cropsByName = arrayToHashmap(CROPS_DATA, 'name');

  constructor() {
    effect(() => {
      const id = this.calendarId();
      if (id && id !== untracked(() => this.form.id().value())) {
        this.loadCalendarById(id);
      }
    });
    // auto-save on changes with debounce
    debouncedEffect(
      this.model,
      (data) => {
        // Avoid duplicate auto-save during initial load complete
        if (this.dbLoaded() && data && this.form().valid()) {
          this.service.save(data);
        }
      },
      2000,
    );

    this.cardService.ready().then(() => {
      this.cardService.dbCollection
        .find({ selector: { type: 'activity' } })
        .$.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((docs) => {
          this.customActivities.set(docs.map((doc) => toActivityOption(doc._data)));
        });
    });
  }

  /** Open the draw-a-card dialog and, once saved, select the new activity into the cell that triggered it */
  public addCustomActivity(control: { (): { value: { (): string[]; set: (value: string[]) => void } } }) {
    const dialogRef = this.dialog.open(SeasonalCalendarCardNewDialogComponent, { data: { type: 'activity' } });
    dialogRef.afterClosed().subscribe(async (card?: ICalendarCard) => {
      if (card) {
        await this.cardService.saveCustomCard(card);
        control().value.set([...control().value(), card.id]);
        await this.saveNow();
      }
    });
  }

  /** Persist immediately rather than waiting on the debounced auto-save, so a newly created
   * custom card survives a refresh right after creation */
  public async saveNow() {
    if (this.dbLoaded() && this.form().valid()) {
      await this.service.save(this.model());
    }
  }

  private async loadCalendarById(id: string) {
    this.dbLoaded.set(false);
    await this.service.ready();
    try {
      const calendar = await this.service.getCalendarById(id);
      if (calendar) {
        this.model.set(calendar.toMutableJSON());
        this.dbLoaded.set(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      // redirect to home page if data has not been loaded successfully
      if (!this.dbLoaded()) {
        this.router.navigate(['/seasonal-calendar']);
      }
    }
  }

  /**
   * Initiates image sharing process, updating UI accordingly.
   */
  public async sharePicture() {
    this.shareDisabled.set(true);
    await _wait(100);
    try {
      await this.service.shareAsImage(this.model().name);
      this.shareStatus.set('share');
    } catch (error: any) {
      this.shareStatus.set(error?.message || 'Share Failed');
    } finally {
      this.shareDisabled.set(false);
    }
  }
}
