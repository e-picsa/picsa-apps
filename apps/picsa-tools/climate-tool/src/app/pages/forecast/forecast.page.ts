import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'climate-forecast',
  templateUrl: './forecast.page.html',
  styleUrls: ['./forecast.page.scss'],
})
export class ClimateForecastPage {
  constructor(
    private route: ActivatedRoute,
  ) {}
  // ngOnInit() {}
}
