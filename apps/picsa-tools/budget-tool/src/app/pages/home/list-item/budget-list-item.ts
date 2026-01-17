import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject,input, model, output, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { BudgetToolComponentsModule } from '../../../components/budget-tool.components';
import { BudgetMaterialModule } from '../../../material.module';
import { IBudget } from '../../../models/budget-tool.models';
import { BudgetStore } from '../../../store/budget.store';

@Component({
  selector: 'budget-list-item',
  templateUrl: './budget-list-item.html',
  styleUrls: ['./budget-list-item.scss'],
  standalone: true,
  imports: [
    FormsModule,
    BudgetMaterialModule,
    BudgetToolComponentsModule,
    DatePipe,
    MatInputModule,
    PicsaTranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetListItemComponent {
  private dialog = inject(MatDialog);
  store = inject(BudgetStore);

  budget = input.required<IBudget>();

  deleteClicked = output();

  renameClicked = output<{ title: string; description: string }>();

  copyClicked = output<{ title: string; description: string }>();

  public titleInput = model('');
  public descriptionInput = model('');

  showCopyDialog(ref: TemplateRef<any>) {
    this.titleInput.set(this.budget().meta.title);
    this.descriptionInput.set(this.budget().meta.description);
    const dialogRef = this.dialog.open(ref, {
      width: '250px',
    });
    dialogRef.afterClosed().subscribe((shouldSave) => {
      if (shouldSave) {
        const title = this.titleInput();
        const description = this.descriptionInput();
        this.copyClicked.emit({ title, description });
      }
    });
  }
  showRenameDialog(ref: TemplateRef<any>) {
    this.titleInput.set(this.budget().meta.title);
    this.descriptionInput.set(this.budget().meta.description);
    const dialogRef = this.dialog.open(ref, {
      width: '250px',
    });
    dialogRef.afterClosed().subscribe((shouldSave) => {
      if (shouldSave) {
        const title = this.titleInput();
        const description = this.descriptionInput();
        this.renameClicked.emit({ title, description });
      }
    });
  }
}
