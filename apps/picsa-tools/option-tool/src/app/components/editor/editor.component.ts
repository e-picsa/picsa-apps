import { Component, EventEmitter,OnInit, Output, ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { PicsaDialogService } from '@picsa/shared/features';

export interface IOptionData {
  practice: string;
  gender: string[];
  benefits: { benefit: string; beneficiary: string[] }[];
  performance: { lowRf: string; midRf: string; highRf: string };
  investment: { money: string; time: string };
  time: string;
  risk: string;
}
@Component({
  selector: 'option-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements OnInit {
  practiceEntry: string;
  gender: string[];
  benefits: { benefit: string; beneficiary: string[] }[];
  perfomanceValues: { lowRf: string; midRf: string; highRf: string };
  performanceOptions: string[] = ['bad', 'ok', 'good'];
  investmentValues: { money: string; time: string };
  investmentOptions: string[] = ['low', 'mid', 'high'];
  benefitsStartTime: string;
  risk: string;
  isLinear = false;

  @ViewChild(MatStepper) stepper: MatStepper;
  @Output() dataTransfer = new EventEmitter<IOptionData | null>();

  constructor(private dialog: PicsaDialogService) {}

  ngOnInit(): void {
    this.gender = [];
    this.benefits = [
      {
        benefit: '',
        beneficiary: [],
      },
    ];
    this.perfomanceValues = { lowRf: 'ok', midRf: 'ok', highRf: 'ok' };
    this.investmentValues = { money: 'mid', time: 'mid' };
    this.practiceEntry = '';
    this.gender = [];
    // this.perfomanceValues = { lowRf: '', midRf: '', highRf: '' };
    this.investmentValues = { money: '', time: '' };
    this.benefitsStartTime = '';
    this.risk = '';
  }

  handleGender(gender: string) {
    if (!this.gender.includes(gender)) {
      this.gender.push(gender);
    } else {
      const index = this.gender.indexOf(gender);
      this.gender.splice(index, 1);
    }
  }
  handleBenficiaryGender(index: number, gender: string) {
    if (!this.benefits[index].beneficiary.includes(gender)) {
      this.benefits[index].beneficiary.push(gender);
    } else {
      const itemIndex = this.benefits[index].beneficiary.indexOf(gender);
      this.benefits[index].beneficiary.splice(itemIndex, 1);
    }
  }
  handleRemovingBenefits(index: number) {
    this.benefits.splice(index, 1);
  }
  handleMoreBenefits() {
    this.benefits.push({
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
    if (!this.practiceEntry) {
      this.dataTransfer.emit(null);
      return;
    }
    const data: IOptionData = {
      practice: this.practiceEntry,
      gender: this.gender,
      benefits: this.benefits,
      performance: this.perfomanceValues,
      investment: this.investmentValues,
      time: this.benefitsStartTime,
      risk: this.risk,
    };
    this.dataTransfer.emit(data);
    this.resetVariables();
    this.resetStepper();
  }
  resetVariables() {
    // Reset variables when the component is destroyed.
    this.gender = [];
    this.benefits = [
      {
        benefit: '',
        beneficiary: [],
      },
    ];
    this.perfomanceValues = { lowRf: 'ok', midRf: 'ok', highRf: 'ok' };
    this.investmentValues = { money: 'mid', time: 'mid' };
    this.practiceEntry = '';
    this.gender = [];
    // this.perfomanceValues = { lowRf: '', midRf: '', highRf: '' };
    this.investmentValues = { money: '', time: '' };
    this.benefitsStartTime = '';
    this.risk = '';
  }
  //incase of edits
  presetVariables(rowData: IOptionData) {
    this.benefits = rowData.benefits;
    this.perfomanceValues = rowData.performance;
    this.investmentValues = rowData.investment;
    this.practiceEntry = rowData.practice;
    this.gender = rowData.gender;
    this.benefitsStartTime = rowData.time;
    this.risk = rowData.risk;
  }
  resetStepper(): void {
    this.stepper.reset();
  }

  updatePerformance(event: any, level: string) {
    const selectedValue = event.target.value;
    
    if (level === "high") {
      this.perfomanceValues = {
        ...this.perfomanceValues,
        highRf: this.performanceOptions[selectedValue]
      };
    }
  
    if (level === "mid") {
      this.perfomanceValues = {
        ...this.perfomanceValues,
        midRf: this.performanceOptions[selectedValue]
      };
    }
  
    if (level === "low") {
      this.perfomanceValues = {
        ...this.perfomanceValues,
        lowRf: this.performanceOptions[selectedValue]
      };
    }
    
  }

  updateInvestmentEffort(event: any, investment: string) {
    const selectedValue = event.target.value; 
    if (investment === "time") {
      this.investmentValues = {
        ...this.investmentValues,
        time: this.investmentOptions[selectedValue]
      };
    }
    if (investment === "money") {
      this.investmentValues = {
        ...this.investmentValues,
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
