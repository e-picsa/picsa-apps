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
import { BudgetCellComponent } from './cell/cell';
import { BudgetTableComponent } from './budget-table/budget-table';
import { CardSelectComponent } from './card-select/card-select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetMaterialModule } from '../material.module';
import { BudgetListItemComponent } from './budget-list-item/budget-list-item';
import { BudgetCellLabourComponent } from './cell/variants/labour/labour';
import { BudgetCellValueComponent } from './cell/variants/value/value';
import { BudgetCellEditorComponent } from './cell-editor/cell-editor';
import { MobxAngularModule } from 'mobx-angular';
import { PicsaDbModule } from '@picsa/modules';

@NgModule({
  declarations: [
    BudgetCardComponent,
    BudgetNewCardComponent,
    BudgetDataCardComponent,
    BudgetMetaCardComponent,
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
    BudgetCardComponent,
    BudgetNewCardComponent,
    BudgetDataCardComponent,
    BudgetMetaCardComponent,
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
