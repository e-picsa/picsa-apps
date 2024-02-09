import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'dashboard-climate-forecast',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './forecast.component.html',
  styleUrls: ['./forecast.component.scss'],
})
export class ClimateForecastPageComponent {}
