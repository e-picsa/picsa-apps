import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { appRoutes } from './app.routes';
import { CropProbabilityTableComponent } from './components/crop-probability-table/crop-probability-table.component';
import { CropProbabilityMaterialModule } from './components/material.module';
import { CropProbabilityTableHeaderComponent } from './components/crop-probability-table-header/crop-probability-table-header.component';

@NgModule({
  declarations: [AppComponent, CropProbabilityTableComponent, CropProbabilityTableHeaderComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes, { initialNavigation: 'enabledBlocking' }),
    CropProbabilityMaterialModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
