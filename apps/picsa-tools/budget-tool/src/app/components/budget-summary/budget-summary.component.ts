import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'budget-summary',
  templateUrl: './budget-summary.component.html',
  styleUrls: ['./budget-summary.component.scss'],
})
export class BudgetSummaryComponent implements OnInit {
  @Input() budgetData: any;

  totalFamilyLabourHours: number = 0;
  totalInputsValue: number = 0;
  totalOutputsValue: number = 0;
  totalProduceSummary: any[] = [];
  finalCashBalance: number = 0;

  ngOnInit(): void {
    this.calculateSummary();
  }

  calculateSummary() {
    this.budgetData.data.forEach((item) => {
      item.familyLabour.forEach((member) => {
        this.totalFamilyLabourHours += member.values.quantity;
      });

      item.inputs.forEach((input) => {
        this.totalInputsValue += input.values.total;
      });

      item.outputs.forEach((output) => {
        this.totalOutputsValue += output.values.total;
      });

      item.produceConsumed.forEach((consumed) => {
        this.updateProduceSummary(consumed);
      });
    });

    this.finalCashBalance = this.totalOutputsValue - this.totalInputsValue;
  }

  updateProduceSummary(consumed: any) {
    const existingProduce = this.totalProduceSummary.find((p) => p.label === consumed.label);

    if (existingProduce) {
      existingProduce.total += consumed.values.quantity;
    } else {
      this.totalProduceSummary.push({
        label: consumed.label,
        total: consumed.values.quantity,
        id: consumed.id,
        extension: consumed.imgType,
      });
    }
  }

  getImagePath(imageId: string, extension: 'png' | 'svg'): string {
    return `assets/budget-cards/${imageId}.${extension}`;
  }
}
