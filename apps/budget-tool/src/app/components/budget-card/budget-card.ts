import { Component, Input, OnInit } from '@angular/core';
import { IBudgetCardDB, IBudgetCard } from '../../models/budget-tool.models';

@Component({
  selector: 'budget-card',
  templateUrl: 'budget-card.html',
  styleUrls: ['budget-card.scss']
})

// implement CVA so can be used in form and template bindings to pass back value
export class BudgetCardComponent implements OnInit {
  // use partial as not sure whether will be budget card or custom budget card
  @Input() card: Partial<IBudgetCard>;
  @Input() newCardId: string;
  @Input() selected: boolean;
  @Input() imageFormat: 'svg' | 'png' = 'png';

  constructor() {}

  ngOnInit(): void {
    if (this.newCardId) {
      this.card = this.generateCard(this.newCardId);
    }
  }

  // if not passing full details (e.g. just enterprise type) create a basic card
  private generateCard(id: string): IBudgetCardDB {
    return {
      // use any type as not budget type (e.g. 'activities') does not include meta enterprise cards
      id,
      type: id as any,
      label: id.charAt(0).toUpperCase() + id.slice(1),
      _key: `custom_${id}`,
      _created: new Date().toISOString(),
      _modified: new Date().toISOString()
    };
  }
}
