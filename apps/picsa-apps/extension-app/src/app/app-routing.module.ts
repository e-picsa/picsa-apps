/* eslint-disable @nx/enforce-module-boundaries */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BudgetToolModule } from '@picsa/budget/src/app/app.module-embedded';
import { ClimateToolModule } from '@picsa/climate/src/app/app.module-embedded';
import { CropProbabilityToolModule } from '@picsa/crop-probability/src/app/app.module-embedded';
import { FarmerContentModule } from '@picsa/farmer-content/src/app/app.module-embedded';
import { ManualToolModule } from '@picsa/manual/src/app/app.module-embedded';
import { MonitoringToolModule } from '@picsa/monitoring/src/app/app.module-embedded';
import { OptionsToolModule } from '@picsa/option/src/app/app.module-embedded';
import { ResourcesToolModule } from '@picsa/resources/src/app/app.module-embedded';
import { SeasonalCalendarToolModule } from '@picsa/seasonal-calendar/src/app/app.module-embedded';

import { TOOL_ROUTES } from './routes';
import { APP_ROUTES } from './routes/app-routes';

@NgModule({
  imports: [
    RouterModule.forRoot([...APP_ROUTES, ...TOOL_ROUTES]),
    BudgetToolModule.forRoot({ urlPrefix: 'budget' }),
    ClimateToolModule.forRoot({ urlPrefix: 'climate' }),
    CropProbabilityToolModule.forRoot({ urlPrefix: 'crop-probability' }),
    ManualToolModule.forRoot({ urlPrefix: 'manual' }),
    MonitoringToolModule.forRoot({ urlPrefix: 'monitoring' }),
    OptionsToolModule.forRoot({ urlPrefix: 'option' }),
    ResourcesToolModule.forRoot({ urlPrefix: 'resources' }),
    SeasonalCalendarToolModule.forRoot({ urlPrefix: 'seasonal-calendar' }),
    // NOTE - the farmer module should be registered last to reuse routes from other tools
    FarmerContentModule.forRoot({ urlPrefix: 'farmer' }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
