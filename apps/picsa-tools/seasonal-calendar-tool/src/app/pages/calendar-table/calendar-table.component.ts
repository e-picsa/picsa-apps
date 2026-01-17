import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { CROPS_DATA, MONTH_DATA_HASHMAP } from '@picsa/data';
import { arrayToHashmap } from '@picsa/utils';
import { _wait } from '@picsa/utils/browser.utils';
import { debounceTime, startWith, Subject, takeUntil } from 'rxjs';

import { CalendarDataEntry } from '../../schema';
import { SeasonCalendarService } from '../../services/calendar.data.service';
import { ISeasonCalendarForm, SeasonCalendarFormService } from '../../services/calendar-form.service';

@Component({
  selector: 'seasonal-calendar-table',
  templateUrl: './calendar-table.component.html',
  styleUrls: ['./calendar-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CalendarTableComponent implements OnInit, OnDestroy {
  /** Table column labels (e.g. names of months) */
  public columnLabels: string[] = [];

  /** Table row labels (e.g. names of crops) */
  public rowLabels: string[] = [];

  /** Toggle whether to enable editing features (names and crops) */
  public editMode = false;

  public form: ISeasonCalendarForm;

  public shareStatus = 'share';
  public shareDisabled = false;

  public get metaFormControls() {
    return this.form.controls.meta.controls;
  }
  public get activityFormControls() {
    return this.form.controls.activities.controls;
  }

  public get formValue() {
    return this.form.getRawValue();
  }

  /** Lookup for crop labels displayed in table rows */
  private cropsByName = arrayToHashmap(CROPS_DATA as any as { name: string; label: string }[], 'name');

  private componentDestroyed$ = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: SeasonCalendarService,
    private formService: SeasonCalendarFormService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    await this.service.ready();
    const { id } = this.route.snapshot.params;
    if (id) {
      const calendar = await this.service.getCalendarById(id);
      if (calendar) {
        this.prepareCalendarForm(calendar);
      }
    }
    // redirect to home page if data has not been loaded successfully
    if (!this.form) {
      this.router.navigate(['/seasonal-calendar']);
    }
  }

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
  }

  /**
   * Launch a mat-dialog instance to edit calendar properties (same as create page)
   * @param templateRef Inline html template reference (used instead of standalone component)
   */
  public async showEditDialog(templateRef: TemplateRef<HTMLElement>) {
    const dialog = this.dialog.open(templateRef);
    dialog.afterClosed().subscribe(() => {
      // Ensure any form changes are reflected once dialog closed
      this.cdr.detectChanges();
    });
  }

  private prepareCalendarForm(calendar: CalendarDataEntry) {
    this.form = this.formService.createForm(calendar);
    this.enableFormAutoSave();
    this.cdr.markForCheck();
    this.subscribeToFormChanges();
  }

  private enableFormAutoSave() {
    this.form.valueChanges.pipe(takeUntil(this.componentDestroyed$), debounceTime(500)).subscribe((v) => {
      this.service.save(this.formValue);
    });
  }

  private subscribeToFormChanges() {
    // Generate list of month labels from ids
    this.metaFormControls.months.valueChanges
      .pipe(takeUntil(this.componentDestroyed$), startWith(this.formValue.meta.months))
      .subscribe((months) => {
        this.columnLabels = months.map((month) => MONTH_DATA_HASHMAP[month]?.label);
      });
    // Generate array of rowLabels from crops
    this.metaFormControls.enterprises.valueChanges
      .pipe(takeUntil(this.componentDestroyed$), startWith(this.formValue.meta.enterprises))
      .subscribe((crops) => {
        this.rowLabels = crops.map((crop) => this.cropsByName[crop]?.label);
      });
  }

  /**
   * Initiates image sharing process, updating UI accordingly.
   */
  public async sharePicture() {
    this.shareDisabled = true;
    this.cdr.markForCheck();
    await _wait(100);
    try {
      await this.service.shareAsImage(this.formValue.name);
      this.shareStatus = 'share';
    } catch (error: any) {
      this.shareStatus = error?.message || 'Share Failed';
    } finally {
      this.shareDisabled = false;
    }
    this.cdr.detectChanges();
  }
}
