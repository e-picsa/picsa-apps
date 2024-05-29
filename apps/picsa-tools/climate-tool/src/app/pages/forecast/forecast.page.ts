import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'climate-forecast',
  templateUrl: './forecast.page.html',
  styleUrls: ['./forecast.page.scss'],
})
export class ClimateForecastPage {
  forecastTypes = ['Annual', 'Downscaled'];
  //always 0 or undefined
  public page: number | undefined = undefined;
  pdfSrc = '/assets/forecast-assets/forecastDoc.pdf'
  constructor(
    private route: ActivatedRoute,
  ) {}
  // ngOnInit() {}
  openAnnualForeCast(){
   this.page = 1;
  }
  openDownscaledForeCast(){

    this.page = 1;
   }
   clearPdf(){

    this.page = undefined;
   }
}
