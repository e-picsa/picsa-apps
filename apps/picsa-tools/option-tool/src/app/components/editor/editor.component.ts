import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
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
  isLinear = false;

  @ViewChild(MatStepper) stepper: MatStepper;
  @Output() dataTransfer = new EventEmitter<IOptionsToolEntry | null>();

  constructor(private dialog: PicsaDialogService) {}

  handleGender(gender: string, field: 'gender_activities' | 'gender_decisions') {
    console.log('handle gender', { gender, field }, this.values[field]);
    if (!this.values[field].includes(gender)) {
      this.values[field].push(gender);
    } else {
      const index = this.values[field].indexOf(gender);
      this.values[field].splice(index, 1);
    }
  }
  handleBenficiaryGender(index: number, gender: string) {
    if (!this.values.benefits[index].beneficiary.includes(gender)) {
      this.values.benefits[index].beneficiary.push(gender);
    } else {
      const itemIndex = this.values.benefits[index].beneficiary.indexOf(gender);
      this.values.benefits[index].beneficiary.splice(itemIndex, 1);
    }
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

  onlyNumbers(event): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
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
    
    if (level === "high") {
      this.values.performance = {
        ...this.values.performance,
        highRf: this.performanceOptions[selectedValue]
      };
    }
  
    if (level === "mid") {
      this.values.performance = {
        ...this.values.performance,
        midRf: this.performanceOptions[selectedValue]
      };
    }
  
    if (level === "low") {
      this.values.performance = {
        ...this.values.performance,
        lowRf: this.performanceOptions[selectedValue]
      };
    }
    
  }

  updateInvestmentEffort(event: any, investment: string) {
    const selectedValue = event.target.value; 
    if (investment === "time") {
      this.values.investment = {
        ...this.values.investment,
        time: this.investmentOptions[selectedValue]
      };
    }
    if (investment === "money") {
      this.values.investment = {
        ...this.values.investment,
        money: this.investmentOptions[selectedValue]
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
