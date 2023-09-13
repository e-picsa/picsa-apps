import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaDialogService } from '@picsa/shared/features';

import { ENTRY_TEMPLATE, IOptionsToolEntry } from '../../schemas';

@Component({
  selector: 'option-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent {
  values = ENTRY_TEMPLATE();

  performanceOptions: string[] = ['bad', 'ok', 'good'];
  investmentOptions: string[] = ['low', 'mid', 'high'];

  public genderSelectors = [
    {
      id: 'female',
      label: translateMarker('Female'),
      color: '#800080',
      icon: 'picsa_options_female',
    },
    {
      id: 'male',
      label: translateMarker('Male'),
      color: '#008066',
      icon: 'picsa_options_male',
    },
  ];

  /** */
  public stepperSteps = [
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
      title: translateMarker('Risk of practice (disadvantage)'),
    },
  ];

  @ViewChild(MatStepper) stepper: MatStepper;
  @Output() dataTransfer = new EventEmitter<IOptionsToolEntry | null>();

  constructor(private dialog: PicsaDialogService) {}

  handleBenficiaryGender(index: number, value: string[]) {
    this.values.benefits[index].beneficiary = value;
  }
  handleRemovingBenefits(index: number) {
    this.values.benefits.splice(index, 1);
  }
  handleMoreBenefits() {
    this.values.benefits.push({
      benefit: '',
      beneficiary: [],
    });
  }

  async submitForm() {
    // minimum for auto save should be at least a name
    if (!this.values.practice) {
      this.dataTransfer.emit(null);
      return;
    }
    this.dataTransfer.emit(this.values);
    this.resetVariables();
    this.resetStepper();
  }
  resetVariables() {
    this.values = ENTRY_TEMPLATE();
  }
  //incase of edits
  presetVariables(rowData: IOptionsToolEntry) {
    this.values = rowData;
  }
  resetStepper(): void {
    this.stepper.reset();
  }
  updatePerformance(event: any, level: string) {
    const selectedValue = event.target.value;

    if (level === 'high') {
      this.values.performance = {
        ...this.values.performance,
        highRf: this.performanceOptions[selectedValue],
      };
    }

    if (level === 'mid') {
      this.values.performance = {
        ...this.values.performance,
        midRf: this.performanceOptions[selectedValue],
      };
    }

    if (level === 'low') {
      this.values.performance = {
        ...this.values.performance,
        lowRf: this.performanceOptions[selectedValue],
      };
    }
  }

  updateInvestmentEffort(event: any, investment: string) {
    const selectedValue = event.target.value;
    if (investment === 'time') {
      this.values.investment = {
        ...this.values.investment,
        time: this.investmentOptions[selectedValue],
      };
    }
    if (investment === 'money') {
      this.values.investment = {
        ...this.values.investment,
        money: this.investmentOptions[selectedValue],
      };
    }
  }

  async promptDelete() {
    const dialogRef = await this.dialog.open('delete');
    dialogRef.afterClosed().subscribe((shouldDelete) => {
      if (shouldDelete) {
        this.dataTransfer.emit(null);
      }
    });
  }
}
