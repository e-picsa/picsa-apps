import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { IBudgetCard } from '../../schema';
import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'budget-cell',
  templateUrl: './cell.html',
  styleUrls: ['./cell.scss'],
  // cells have parent content changing frequently so run manual change detection
  // for better performance
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class BudgetCellComponent implements OnInit, OnDestroy, OnChanges {
  @Input() type: string;
  @Input() periodIndex: number;
  cellValue$: Subscription;
  cellData: IBudgetCard[];

  constructor(public store: BudgetStore, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this._addValueSubscription();
  }

  // as type and period index can change (in summary component), handle subscription using changes
  ngOnChanges(changes: SimpleChanges) {
    if (changes.periodIndex) {
      this._addValueSubscription();
    }
  }

  // using manual methods to get values instead of bindings to allow more efficient change detection
  getCellValue() {
    const cards: IBudgetCard[] = this.store.activeBudgetValue.data[this.periodIndex][this.type];
    if (cards.length > 0) {
      this.cellData = cards;
    } else {
      // empty should be treated as null (cell has been entered but no data selected)
      this.cellData = null as any;
    }
    this.cdr.detectChanges();
  }

  // subscribe to changes store object to run manual changed detection on cell update
  private _addValueSubscription() {
    this.cellValue$ = this.store.changes.subscribe((change) => {
      if (change[0] === this.periodIndex && change[1] === this.type) {
        this.getCellValue();
      }
    });
    this.getCellValue();
  }

  ngOnDestroy(): void {
    this.cellValue$.unsubscribe();
  }
}
