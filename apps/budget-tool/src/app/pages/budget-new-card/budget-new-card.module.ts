import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Routes, RouterModule } from "@angular/router";

import { IonicModule } from "@ionic/angular";

import { BudgetNewCardPage } from "./budget-new-card.page";
import { CanvasWhiteboardModule } from "ng2-canvas-whiteboard";

const routes: Routes = [
  {
    path: "",
    component: BudgetNewCardPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CanvasWhiteboardModule,
    RouterModule.forChild(routes)
  ],
  declarations: [BudgetNewCardPage]
})
export class BudgetNewCardPageModule {}
