import { Component, Input, OnInit } from '@angular/core';

import { IBudget } from '../../models/budget-tool.models';
import { IBudgetCardWithValues } from '../../schema';

interface ISummaryEntry {
  label: string;
  total: number;
  id: string;
  imgPath: string;
}

@Component({
  selector: 'budget-summary',
  templateUrl: './budget-summary.component.html',
  styleUrls: ['./budget-summary.component.scss'],
})
export class BudgetSummaryComponent implements OnInit {
  @Input() budgetData: IBudget['data'];

  totalFamilyLabourHours = 0;
  totalInputsValue = 0;
  totalOutputsValue = 0;
  totalProduceSummary: ISummaryEntry[] = [];
  finalCashBalance = 0;

  ngOnInit(): void {
    this.calculateSummary();
  }

  calculateSummary() {
    this.budgetData.forEach((item) => {
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

  updateProduceSummary(consumed: IBudgetCardWithValues) {
    const existingProduce = this.totalProduceSummary.find((p) => p.label === consumed.label);

    if (existingProduce) {
      existingProduce.total += consumed.values.quantity;
    } else {
      this.totalProduceSummary.push({
        label: consumed.label,
        total: consumed.values.quantity,
        id: consumed.id,
        imgPath: this.getImagePath(consumed.id, consumed.imgType),
      });
    }
  }

  getImagePath(imageId: string, extension: 'png' | 'svg'): string {
    return `assets/budget-cards/${imageId}.${extension}`;
  }
}
