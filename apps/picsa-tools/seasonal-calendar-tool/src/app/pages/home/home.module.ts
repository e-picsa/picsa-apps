import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SeasonalCalendarToolComponentsModule } from '../../components/components.module';
import { HomeComponent } from './home.component';
import { HomeRoutingModule } from './home.routing.module';

@NgModule({
  declarations: [HomeComponent],
  imports: [CommonModule, HomeRoutingModule, SeasonalCalendarToolComponentsModule],
})
export class HomeModule {}
