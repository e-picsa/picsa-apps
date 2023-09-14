import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaDialogService } from '@picsa/shared/features';

import { ENTRY_TEMPLATE, IOptionsToolEntry } from '../../schemas';

const PERFORMANCE_CONDITIONS = [
  {
    id: 'lowRf',
    label: translateMarker('Low'),
    svgIcon: 'picsa_options_rain_low',
  },
  {
    id: 'midRf',
    label: translateMarker('Mid'),
    svgIcon: 'picsa_options_rain_medium',
  },
  {
    id: 'highRf',
    label: translateMarker('High'),
    svgIcon: 'picsa_options_rain_high',
  },
];

const INVESTMENT_TYPES = [
  {
    id: 'money',
    label: translateMarker('Money'),
    matIcon: 'payments',
  },
  {
    id: 'time',
    label: translateMarker('Time'),
    matIcon: 'schedule',
  },
];

const STEPPER_STEPS = [
  {
    id: 'practice',
    label: translateMarker('Practice'),
    title: translateMarker('Name of practice'),
  },
  {
    id: 'gender_decisions',
    label: translateMarker('Decisions'),
    title: translateMarker('Who makes decisions'),
  },
  {
    id: 'gender_activities',
    label: translateMarker('Activities'),
    title: translateMarker('Who does the activity'),
  },
  {
    id: 'benefits',
    label: translateMarker('Benefits'),
    title: translateMarker('Benefits and who'),
  },
  {
    id: 'performance',
    label: translateMarker('Performance'),
    title: translateMarker('Performance in high, mid and low rainfall'),
  },
  {
    id: 'investment',
    label: translateMarker('Investment'),
    title: translateMarker('Investment in terms of money and time'),
  },
  {
    id: 'time',
    label: translateMarker('Time'),
    title: translateMarker('Time to start benefiting'),
  },
  {
    id: 'risk',
    label: translateMarker('Risk'),
    title: translateMarker('Risks or disadvantages'),
  },
];

@Component({
  selector: 'option-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent {
  public values = ENTRY_TEMPLATE();
  public performanceConditions = PERFORMANCE_CONDITIONS;
  public investmentTypes = INVESTMENT_TYPES;
  public stepperSteps = STEPPER_STEPS;

  @ViewChild(MatStepper) stepper: MatStepper;
  @Output() dataTransfer = new EventEmitter<IOptionsToolEntry | null>();

  constructor(private dialog: PicsaDialogService) {}

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
    // minimum for auto save should be at least a name
    if (!this.values.practice) {
      this.dataTransfer.emit(null);
      return;
    }
    this.dataTransfer.emit(this.values);
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
