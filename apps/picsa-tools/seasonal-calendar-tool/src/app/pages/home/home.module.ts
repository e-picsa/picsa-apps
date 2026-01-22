import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PicsaTranslateModule } from '@picsa/i18n';

import { SeasonalCalendarToolComponentsModule } from '../../components/components.module';
import { HomeComponent } from './home.component';
import { HomeRoutingModule } from './home.routing.module';

@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HomeRoutingModule,
    SeasonalCalendarToolComponentsModule,
    FormsModule,
    PicsaTranslateModule,
  ],
})
export class HomeModule {}
