import { Component, Input, OnInit } from '@angular/core';
import { Events } from '@ionic/angular';
import { Subject } from 'rxjs';
import { IBudget } from '../../models/budget-tool.models';

@Component({
  selector: 'budget-table',
  templateUrl: 'budget-table.html',
  styleUrls: ['./budget-table.scss']
})
export class BudgetTableComponent implements OnInit {
  private componentDestroyed: Subject<any> = new Subject();
  @Input() budget: IBudget;
  rowTitles: any = [
    { type: 'activities', label: 'Activities' },
    { type: 'inputs', label: 'Inputs' },
    { type: 'familyLabour', label: 'Family Labour' },
    { type: 'outputs', label: 'Outputs' },
    { type: 'produceConsumed', label: 'Produce Consumed' },
    { type: 'cashBalance', label: 'Balance' }
  ];
  dotsLegend = [];
  balance: any;
  budgetUpdated = true;

  constructor(public events: Events) {}
  ngOnInit(): void {
    this.dotsLegend = Object.entries(this.budget.dotValues);
    console.log('dots legend', this.dotsLegend);
  }

  // track-by function passed to ngFor loops where value already represents unique key
  tbKey(index: number, key: string) {
    return key;
  }

  private _objectToArray(json: any) {
    const array = [];
    for (const key in json) {
      if (json.hasOwnProperty(key)) {
        array.push({ key: key, value: json[key] });
      }
    }
    return array;
  }
}
