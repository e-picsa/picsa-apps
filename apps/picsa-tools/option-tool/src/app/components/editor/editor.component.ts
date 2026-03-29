import { Component, EventEmitter, inject, OnInit, Output, signal, ViewChild } from '@angular/core';
import { form } from '@angular/forms/signals';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { PicsaDialogService } from '@picsa/shared/features';

import { ENTERPRISES_BY_ID, INVESTMENT_TYPES, PERFORMANCE_CONDITIONS, STEPPER_STEPS } from '../../data';
import { ENTRY_TEMPLATE, IOptionsToolEntry } from '../../schemas';

@Component({
  selector: 'option-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  standalone: false,
})
export class EditorComponent implements OnInit {
  private dialog = inject(PicsaDialogService);
  private route = inject(ActivatedRoute);
  private componentService = inject(PicsaCommonComponentsService);

  /** model used to read and set full form values */
  public model = signal<IOptionsToolEntry>(ENTRY_TEMPLATE());

  /** form bindings */
  public form = form(this.model);

  public performanceConditions = PERFORMANCE_CONDITIONS;
  public investmentTypes = INVESTMENT_TYPES;
  public stepperSteps = STEPPER_STEPS;

  private enterprise: IOptionsToolEntry['enterprise'];

  @ViewChild(MatStepper) stepper: MatStepper;
  @Output() dataTransfer = new EventEmitter<IOptionsToolEntry | null>();

  ngOnInit() {
    const enterpriseID = this.route.snapshot.paramMap.get('enterprise');
    if (enterpriseID) {
      const enterpriseData = ENTERPRISES_BY_ID[enterpriseID];
      this.enterprise = enterpriseData.id;
      this.componentService.patchHeader({ title: enterpriseData.title });
    }
  }

  public setFormBenefit(index: number, benefit: any) {
    this.form.benefits[index].benefit().value.set(benefit);
  }
  public setFormTimeValue(value: string | number) {
    // Bypass formField binding as nested `form.time.value` as name conflicts
    // with `value()` property. Ensure cast to number
    const parsed = value ? Number(value) : null;
    this.form.time().value.update((v) => ({ ...v, value: parsed }));
  }

  public handleRemovingBenefits(index: number) {
    this.form.benefits().value.update((v) => v.filter((_, i) => i !== index));
  }
  public handleMoreBenefits() {
    this.form.benefits().value.update((v) => [...v, { benefit: '', beneficiary: [] }]);
  }

  public async submitForm() {
    this.form.enterprise().value.set(this.enterprise);
    // minimum for auto save should be at least a name
    if (!this.form.practice().value()) {
      this.dataTransfer.emit(null);
      return;
    }
    // Emit the values
    this.dataTransfer.emit(this.model());
    // Reset form
    this.resetForm();
  }

  private resetForm() {
    this.resetVariables();
    this.resetStepper();
  }

  // Allow update from home copmonent
  public presetVariables(rowData: IOptionsToolEntry) {
    this.model.set(rowData);
  }
  public async promptDelete() {
    const dialogRef = await this.dialog.open('delete');
    dialogRef.afterClosed().subscribe((shouldDelete) => {
      if (shouldDelete) {
        this.dataTransfer.emit(null);
      }
    });
  }
  public resetVariables() {
    this.model.set(ENTRY_TEMPLATE());
  }

  /**
   * Using [(ngModel)] bindings inside an array requires simple trackBy function
   * https://stackoverflow.com/a/50139592
   **/
  public trackByIndex(index: number) {
    return index;
  }

  private resetStepper(): void {
    this.stepper.reset();
  }
}
