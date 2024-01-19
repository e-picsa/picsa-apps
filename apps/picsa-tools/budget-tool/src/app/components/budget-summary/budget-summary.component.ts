import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'budget-summary',
  template: `
    <div class="summary-container">
      <h4>Details</h4>
      <div class="summary-list">
        <p matTooltip="Total Family Labour Hours">
          <img [src]="getImagePath('family', 'svg')" alt="Groups Icon" class="icon" />:
          <b>{{ totalFamilyLabourHours }}</b>
        </p>
        <p matTooltip="Total Inputs Value">
          <img [src]="getImagePath('inputs', 'svg')" alt="Receipt Icon" class="icon" /> : <b>{{ totalInputsValue }}</b>
        </p>
        <p matTooltip="Total Outputs Value">
          <img [src]="getImagePath('outputs', 'svg')" alt="Monetization Icon" class="icon" />:
          <b>{{ totalOutputsValue }}</b>
        </p>
        <div *ngFor="let produce of totalProduceSummary">
          <p [matTooltip]="'Total ' + produce.label + ' consumed'">
            <img [src]="getImagePath(produce.id, produce.extension)" [alt]="produce.label + ' Icon'" class="icon" />
            : <b>{{ produce.total }}</b>
          </p>
        </div>
        <p matTooltip="Final Cash Balance">
          <img [src]="getImagePath('cash-balance', 'svg')" alt="Wallet Icon" class="icon" />:
          <b>{{ finalCashBalance }}</b>
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
