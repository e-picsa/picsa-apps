import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { NgModule } from '@angular/core';
import { HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { GestureConfig } from '@angular/material/core';

// NOTE - slide module requires import 'hammerjs' in app.module.ts;
// also other deps from: https://material.angular.io/guide/getting-started
// https://github.com/angular/components/issues/4278 and also load in app.module.ts

@NgModule({
  imports: [MatButtonModule, MatIconModule, MatCardModule, MatSliderModule],
  exports: [MatButtonModule, MatIconModule, MatCardModule, MatSliderModule]
})
export class ClimateMaterialModule {}
