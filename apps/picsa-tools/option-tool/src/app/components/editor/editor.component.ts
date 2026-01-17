import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
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
  public values = ENTRY_TEMPLATE();
  public performanceConditions = PERFORMANCE_CONDITIONS;
  public investmentTypes = INVESTMENT_TYPES;
  public stepperSteps = STEPPER_STEPS;

  private enterprise: IOptionsToolEntry['enterprise'];

  @ViewChild(MatStepper) stepper: MatStepper;
  @Output() dataTransfer = new EventEmitter<IOptionsToolEntry | null>();

  constructor(
    private dialog: PicsaDialogService,
    private route: ActivatedRoute,
    private componentService: PicsaCommonComponentsService,
  ) {}

  ngOnInit() {
    const enterpriseID = this.route.snapshot.paramMap.get('enterprise');
    if (enterpriseID) {
      const enterpriseData = ENTERPRISES_BY_ID[enterpriseID];
      this.enterprise = enterpriseData.id;
      this.componentService.patchHeader({ title: enterpriseData.title });
    }
  }

  public handleRemovingBenefits(index: number) {
    this.values.benefits.splice(index, 1);
  }
  public handleMoreBenefits() {
    this.values.benefits.push({
      benefit: '',
      beneficiary: [],
    });
  }

  public async submitForm() {
    this.values.enterprise = this.enterprise;
    // minimum for auto save should be at least a name
    if (!this.values.practice) {
      this.dataTransfer.emit(null);
      return;
    }
    // Emit the values
    this.dataTransfer.emit(this.values);
    // Reset form
    this.resetForm();
  }

  private resetForm() {
    this.resetVariables();
    this.resetStepper();
  }

  // Allow update from home copmonent
  public presetVariables(rowData: IOptionsToolEntry) {
    this.values = rowData;
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
    this.values = ENTRY_TEMPLATE();
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
