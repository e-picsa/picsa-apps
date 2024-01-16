import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'budget-summary',
  template: `
    <div class="summary-container">
      <h2>Details</h2>
      <div class="summary-list">
        <p matTooltip="Total Family Labour Hours">
          TFLH: <b>{{ totalFamilyLabourHours }}</b>
        </p>
        <p matTooltip="Total Inputs Value">
          TIV: <b>{{ totalInputsValue }}</b>
        </p>
        <p matTooltip="Total Outputs Value">
          TOV: <b>{{ totalOutputsValue }}</b>
        </p>
        <p matTooltip="Total Produce Consumed">
          TPC: <b>{{ totalProduceConsumed }}</b>
        </p>
        <p matTooltip="Final Cash Balance">
          FCB: <b>{{ finalCashBalance }}</b>
        </p>
      </div>
    </div>
  `,
  styleUrls: ['./budget-summary.component.scss'],
})
export class BudgetSummaryComponent implements OnInit {
  @Input() budgetData: any;

  totalFamilyLabourHours: number = 0;
  totalInputsValue: number = 0;
  totalOutputsValue: number = 0;
  totalProduceConsumed: number = 0;
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
        this.totalProduceConsumed += consumed.values.quantity;
      });
    });

    this.finalCashBalance = this.totalOutputsValue - this.totalInputsValue;
  }
}
