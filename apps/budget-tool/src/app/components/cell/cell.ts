import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { IBudgetCard } from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'budget-cell',
  templateUrl: './cell.html',
  styleUrls: ['./cell.scss']
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class BudgetCellComponent implements OnInit, OnDestroy {
  @Input('type') type: string;
  @Input('periodIndex') periodIndex: number;
  destroyed$ = new Subject<boolean>();
  cellData: IBudgetCard[];

  constructor(public store: BudgetStore, private cdr: ChangeDetectorRef) {}

  // subscribe to changes store object to run manual changed detection on cell update
  ngOnInit(): void {
    this.store.changes.pipe(takeUntil(this.destroyed$)).subscribe(change => {
      if (change[0] === this.periodIndex && change[1] === this.type) {
        this.getCellValue();
      }
    });
    this.getCellValue();
  }

  // using manual methods to get values instead of bindings to allow more efficient change detection
  getCellValue() {
    const cards: IBudgetCard[] = this.store.activeBudgetValue.data[
      this.periodIndex
    ][this.type];
    if (cards.length > 0) {
      this.cellData = cards;
    } else {
      // empty should be treated as null (cell has been entered but no data selected)
      this.cellData = null;
    }

    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.unsubscribe();
  }
}
