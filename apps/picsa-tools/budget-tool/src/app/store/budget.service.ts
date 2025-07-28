/* eslint-disable @nx/enforce-module-boundaries */
import { Injectable, signal } from '@angular/core';

import { IBudgetPeriodType } from '../models/budget-tool.models';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  public editMode = signal(false);

  public activePeriod = signal(0);
  public activeType = signal<IBudgetPeriodType>('activities');
}
