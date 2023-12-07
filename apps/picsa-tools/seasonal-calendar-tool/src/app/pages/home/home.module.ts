import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';

import { SeasonalCalendarToolComponentsModule } from '../../components/components.module';
import { HomeComponent } from './home.component';
import { HomeRoutingModule } from './home.routing.module';

@NgModule({
  declarations: [HomeComponent],
  imports: [CommonModule, HomeRoutingModule, SeasonalCalendarToolComponentsModule,FormsModule,PicsaTranslateModule ],
})
export class HomeModule {}
