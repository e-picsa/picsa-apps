import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { IBudgetCard, IBudgetCardDB } from '../../models/budget-tool.models';
import { PicsaDialogService } from '@picsa/shared/features';
import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'budget-card',
  templateUrl: 'budget-card.html',
  styleUrls: ['budget-card.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

// implement CVA so can be used in form and template bindings to pass back value
export class BudgetCardComponent {
  // use partial as not sure whether will be budget card or custom budget card
  @Input() card: IBudgetCard;
  @Input() selected: boolean;

  @Input() showDeleteButton = false;
  @Output() deleteClicked = new EventEmitter<IBudgetCard>();

  constructor(private dialog: PicsaDialogService, public store: BudgetStore) {}

  async promptCustomDelete(e: Event) {
    e.stopPropagation();
    const dialogRef = await this.dialog.open('delete');
    dialogRef.afterClosed().subscribe((v) => {
      if (v) {
        this.store.deleteCustomCard(this.card as IBudgetCardDB);
        // HACK - instead of refreshing from store just mark
        // as deleted to hide (will be gone next refresh)
        this.card['_deleted'] = true;
      }
    });
  }
}
