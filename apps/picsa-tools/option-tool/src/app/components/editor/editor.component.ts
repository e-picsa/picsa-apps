import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  OnInit,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { FieldState, form, FormField } from '@angular/forms/signals';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components';
import { FormNumberValueAccessor } from '@picsa/forms/directives/numberValueAccessor';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PicsaDialogService } from '@picsa/shared/features';

import { ENTERPRISES_BY_ID, INVESTMENT_TYPES, PERFORMANCE_CONDITIONS, STEPPER_STEPS } from '../../data';
import { ENTRY_TEMPLATE, IOptionsToolEntry } from '../../schemas';
import { OptionMaterialModule } from '../material.module';
import { GenderInputComponent } from './inputs/gender/gender-input';
import { InvestmentInputComponent } from './inputs/investment/investment-input';
import { PerformanceInputComponent } from './inputs/performance/performance-input';

@Component({
  selector: 'option-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],

  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    GenderInputComponent,
    FormField,
    FormNumberValueAccessor,
    InvestmentInputComponent,
    OptionMaterialModule,
    PicsaTranslateModule,
    CommonModule,
    PerformanceInputComponent,
  ],
})
export class EditorComponent implements OnInit {
  private dialog = inject(PicsaDialogService);
  private route = inject(ActivatedRoute);
  private componentService = inject(PicsaCommonComponentsService);

  /** model used to read and set full form values */
  public model = signal<IOptionsToolEntry>(ENTRY_TEMPLATE());

  /** form bindings */
  public form = form(this.model);

  public readonly performanceConditions = PERFORMANCE_CONDITIONS;
  public readonly investmentTypes = INVESTMENT_TYPES;
  public readonly stepperSteps = STEPPER_STEPS;

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

  public setFormBenefit(index: number, benefit: string) {
    this.form.benefits[index].benefit().value.set(benefit);
  }

  public formArrayPush<T>(field: FieldState<T[], string>, value: T) {
    field.value.update((v) => [...v, value]);
  }
  public formArrayRemove<T>(field: FieldState<T[], string>, index: number) {
    field.value.update((v) => v.filter((_, i) => i !== index));
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

  private resetStepper(): void {
    this.stepper.reset();
  }
}
