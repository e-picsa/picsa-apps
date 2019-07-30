import { NgRedux } from '@angular-redux/store';
import { Component } from '@angular/core';
import { BudgetToolActions } from '../../store/budget-tool.actions';
import { BudgetCardComponent } from './budget-card';
import { BudgetStore } from '../../store/budget.store';

/*
Budget meta cards are used to assign card value to top-level budget object data (e.g. enterprise type)
*/
@Component({
  selector: 'budget-meta-card',
  templateUrl: 'budget-card.html'
})
export class BudgetMetaCardComponent extends BudgetCardComponent {
  // private componentDestroyed: Subject<any> = new Subject();
  // @Input() valuePath: string;

  constructor(public actions: BudgetToolActions, public store: BudgetStore) {
    super(actions, store);
  }

  // ngOnInit() {
  //   // this._addValueSubscriber();
  // }
  // ngOnDestroy() {
  //   // this.componentDestroyed.next();
  //   // this.componentDestroyed.unsubscribe();
  // }

  // budget meta cards listen directly to their corresponding value field and update isselected property on change
  // *** note - this could all be done through budget-card-list element to avoid so many subscriptions, but assumed fine for now)
  // _addValueSubscriber() {
  //   this.ngRedux
  //     .select(['budget', 'active', this.valuePath])
  //     .pipe(takeUntil(this.componentDestroyed))
  //     .subscribe(v => {
  //       this.card.isSelected = v === this.card.id;
  //       this.selected = this.card.isSelected;
  //     });
  // }

  // assign card id to value path on select (and remove if already selected)
  cardClicked() {}
}
