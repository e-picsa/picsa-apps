import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { CanvasWhiteboardModule } from 'ng2-canvas-whiteboard';
import { BudgetCardImageComponent } from './card/card-image/budget-card-image';
import { BudgetCardListComponent } from './card/card-list/budget-card-list';
import { BudgetCardComponent } from './card/budget-card';
import { BudgetDataCardComponent } from './card/budget-data-card';
import { BudgetCellComponent } from './cell/cell';
import { BudgetTableComponent } from './table/budget-table';
import { CardSelectComponent } from './card/card-select/card-select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetMaterialModule } from '../material.module';
import { BudgetListItemComponent } from './list-item/budget-list-item';
import { BudgetCellLabourComponent } from './cell/variants/labour/labour';
import { BudgetCellValueComponent } from './cell/variants/value/value';
import { BudgetCellEditorComponent } from './cell-editor/cell-editor';
import { MobxAngularModule } from 'mobx-angular';
import { PicsaDbModule } from '@picsa/modules';
import { BudgetBalanceDotsComponent } from './balance/balance-dots/balance-dots';

@NgModule({
  declarations: [
    BudgetBalanceDotsComponent,
    BudgetCardComponent,
    BudgetDataCardComponent,
    BudgetCardImageComponent,
    BudgetCardListComponent,
    BudgetCellComponent,
    BudgetCellEditorComponent,
    BudgetCellLabourComponent,
    BudgetCellValueComponent,
    BudgetListItemComponent,
    BudgetTableComponent,
    CardSelectComponent
  ],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    BudgetMaterialModule,
    TranslateModule.forChild(),
    CanvasWhiteboardModule,
    MobxAngularModule,
    PicsaDbModule
  ],
  exports: [
    BudgetBalanceDotsComponent,
    BudgetCardComponent,
    BudgetDataCardComponent,
    BudgetCardImageComponent,
    BudgetCardListComponent,
    BudgetCellComponent,
    BudgetCellEditorComponent,
    BudgetCellLabourComponent,
    BudgetCellValueComponent,
    BudgetListItemComponent,
    BudgetTableComponent,
    CardSelectComponent
  ]
})
export class BudgetToolComponentsModule {}
