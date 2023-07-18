import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PicsaDialogService } from '@picsa/shared/features';

import { IBudgetCard } from '../../schema';
import { BudgetStore } from '../../store/budget.store';
import { BudgetCardService } from '../../store/budget-card.service';

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
  @Input() showCustomCardDelete = true;

  constructor(public store: BudgetStore, private dialog: PicsaDialogService, private cardService: BudgetCardService) {}

  async promptCustomDelete(e: Event) {
    e.stopPropagation();
    const dialogRef = await this.dialog.open('delete');
    dialogRef.afterClosed().subscribe((v) => {
      if (v) {
        this.cardService.deleteCustomCard(this.card as IBudgetCard);
      }
    });
  }
}
