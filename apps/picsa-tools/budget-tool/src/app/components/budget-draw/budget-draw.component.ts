import { Component } from '@angular/core';
import { PicsaDrawingComponent } from '@picsa/shared/features';

@Component({
  selector: 'budget-draw',
  standalone:true,
  imports: [PicsaDrawingComponent],
  templateUrl: './budget-draw.component.html',
  styleUrl: './budget-draw.component.scss',
})
export class BudgetDrawComponent {}
