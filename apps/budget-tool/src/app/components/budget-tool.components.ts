import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { CanvasWhiteboardModule } from 'ng2-canvas-whiteboard';
import { BudgetCardImageComponent } from './budget-card-image/budget-card-image';
import { BudgetCardListComponent } from './budget-card-list/budget-card-list';
import { BudgetCardComponent } from './budget-card/budget-card';
import { BudgetDataCardComponent } from './budget-card/budget-data-card';
import { BudgetMetaCardComponent } from './budget-card/budget-meta-card';
import { BudgetNewCardComponent } from './budget-card/budget-new-card';
import { BudgetCellLabourComponent } from './budget-cell-labour/budget-cell-labour';
import { BudgetCellValueComponent } from './budget-cell-value/budget-cell-value';
import { BudgetCellComponent } from './budget-cell/budget-cell';
import { BudgetOverviewComponent } from './budget-overview/budget-overview';
import { CardSelectComponent } from './card-select/card-select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetMaterialModule } from '../material.module';
import { BudgetListItemComponent } from './budget-list-item/budget-list-item';

@NgModule({
  declarations: [
    BudgetCardComponent,
    BudgetNewCardComponent,
    BudgetDataCardComponent,
    BudgetMetaCardComponent,
    BudgetCardImageComponent,
    BudgetCardListComponent,
    BudgetCellComponent,
    BudgetCellLabourComponent,
    BudgetCellValueComponent,
    BudgetListItemComponent,
    BudgetOverviewComponent,
    CardSelectComponent
  ],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    BudgetMaterialModule,
    TranslateModule.forChild(),
    CanvasWhiteboardModule
  ],
  exports: [
    BudgetCardComponent,
    BudgetNewCardComponent,
    BudgetDataCardComponent,
    BudgetMetaCardComponent,
    BudgetCardImageComponent,
    BudgetCardListComponent,
    BudgetCellComponent,
    BudgetCellLabourComponent,
    BudgetCellValueComponent,
    BudgetListItemComponent,
    BudgetOverviewComponent,
    CardSelectComponent
  ]
})
export class BudgetToolComponentsModule {}
