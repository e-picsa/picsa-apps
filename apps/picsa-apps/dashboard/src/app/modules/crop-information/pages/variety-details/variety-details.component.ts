import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { Subject, takeUntil } from 'rxjs';

import { DashboardMaterialModule } from '../../../../material.module';
import { CropInformationService, ICropInformationInsert, ICropInformationRow } from '../../services';

@Component({
  selector: 'dashboard-crop-variety-details',
  imports: [DashboardMaterialModule, RouterModule, FormsModule, PicsaFormsModule, ReactiveFormsModule],
  templateUrl: './variety-details.component.html',
  styleUrl: './variety-details.component.scss',
})
export class CropVarietyDetailsComponent implements OnInit, OnDestroy {
  entryForm = this.formBuilder.nonNullable.group({
    id: new FormControl(), // populated by server or on edit
    crop: ['', Validators.required],
    variety: ['', Validators.required],
    label: new FormControl<string>(''),

    // water_lower: [0],
    // water_upper: [0],
    // length_lower: [0],
    // length_upper: [0],
  });

  /** Utility method, retained to ensure rawValue corresponds to expected CaledarDataEntry type */
  private get formValue() {
    const entry: ICropInformationInsert = this.entryForm.getRawValue();
    return entry;
  }
  private componentDestroyed$ = new Subject<boolean>();

  constructor(
    private service: CropInformationService,
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: PicsaNotificationService,
    public dialog: MatDialog
  ) {}

  async ngOnInit() {
    await this.service.ready();

    const { id } = this.route.snapshot.params;
    // load editable entry from route param unless on /new route
    if (id && id !== 'add') {
      await this.loadEditableEntry(id);
      // avoid crop type or variety change after entry created as wil change id
      this.entryForm.controls.crop.disable();
      this.entryForm.controls.variety.disable();
    }
    this.addFormValueModifiers();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  async submitForm() {
    if (this.formValue.id) {
      await this.service.update(this.formValue);
    } else {
      // remove null id when adding crop probability
      const { id, ...data } = this.formValue;
      await this.service.insert(data);
    }
    // navigate back after successful addition
    return this.goToVarietyListPage();
  }

  public async handleDelete() {
    await this.service.table.delete().eq('id', this.formValue.id);
    return this.goToVarietyListPage();
  }
  private goToVarietyListPage() {
    this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
  }

  /**
   * Automatically alter inputs to clean and sanitize data
   * Enforces variety names to be upper case with only alphanumeric and dash allowed
   */
  private addFormValueModifiers() {
    this.entryForm.controls.variety.valueChanges.pipe(takeUntil(this.componentDestroyed$)).subscribe((variety) => {
      const cleanedValue = variety.toUpperCase().replace(/[^0-9a-z-]/gi, '-');
      if (variety !== cleanedValue) {
        this.entryForm.patchValue({ variety: cleanedValue }, { emitEvent: true });
      }
    });
  }

  /** Load an existing db record for editing */
  private async loadEditableEntry(id: string) {
    const { data, error } = await this.service.table.select<'*', ICropInformationRow>('*').eq('id', id).single();
    if (data) {
      this.entryForm.patchValue(data);
    }
    if (error) {
      throw new Error('error');
      this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
    }
  }
}
