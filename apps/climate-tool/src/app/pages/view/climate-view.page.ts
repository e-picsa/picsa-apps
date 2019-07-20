import { Component, OnInit } from '@angular/core';
import {
  ISite,
  IChartMeta,
  ICropRequirement
} from '@picsa/models/climate.models';
import * as DATA from 'src/app/data';
import { MenuController } from '@ionic/angular';
import { ClimateToolService } from 'src/app/services/climate-tool.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'climate-view',
  templateUrl: './climate-view.page.html',
  styleUrls: ['./climate-view.page.scss']
})
export class ClimateViewPage implements OnInit {
  activeSite: ISite;
  activeChart: IChartMeta;
  availableCharts: IChartMeta[] = DATA.CHART_TYPES;
  // showTools: boolean = true;
  // showDefinition: boolean = false;
  lineToolValue: number;
  probabilities: any;
  crops = DATA.cropRequirements;
  selectedCrop: ICropRequirement;
  // columns = [];

  constructor(
    public menuCtrl: MenuController,
    public climateService: ClimateToolService, // private actions: ClimateToolActions
    private route: ActivatedRoute
  ) {}
  ngOnInit(): void {
    const siteId = this.route.snapshot.params.siteId;
    this.activeSite = DATA.SITES.find(s => s._id == siteId);
    console.log('site', this.activeSite);
  }

  setChart(chart: IChartMeta) {
    this.activeChart = chart;
  }

  showAllCharts() {
    this.activeChart = null;
  }
  // when manually setting line tool value unselect all crops
  setLineToolValue() {
    this.selectedCrop = null;
    this.lineToolValueChange();
  }
  lineToolValueChange() {
    // this.actions.updateSite({
    //   lineToolValue: this.lineToolValue
    // });
    // this.climatePrvdr.setLineToolValue(this.lineToolValue);
    this.probabilities = this.climateService.calculateProbabilities(
      this.lineToolValue
    );
    console.log('probabilities', this.probabilities);
  }
  setCrop(crop: ICropRequirement) {
    this.selectedCrop = crop;
    const yVar = this.activeChart.y;
    let lineToolValue;
    if (yVar == 'Rainfall') {
      lineToolValue = this._calculateMean([crop.waterMin, crop.waterMax]);
    }
    if (yVar == 'Length') {
      lineToolValue = this._calculateMean([crop.daysMin, crop.daysMax]);
    }
    // only update if not already set (i.e. only change once when updating crop and triggering function)
    if (lineToolValue != this.lineToolValue) {
      this.lineToolValue = lineToolValue;
      this.lineToolValueChange();
    }
  }

  _calculateMean(numbers: number[]) {
    // remove null values
    numbers = numbers.filter(n => {
      return n ? true : false;
    });
    let total = 0,
      i;
    for (i = 0; i < numbers.length; i += 1) {
      total += numbers[i];
    }
    return total / numbers.length;
  }

  // toggleFullScreen() {
  //   this.fullScreenView = !this.fullScreenView;
  //   console.log("resize?");
  //   console.log("screen", window.screen);
  //   if (!this.fullScreenView) {
  //     this.climatePrvdr.resize({
  //       height: window.screen.height - 80,
  //       width: window.screen.width - 20
  //     });
  //   } else {
  //     this.climatePrvdr.resize({
  //       height: 320,
  //       width: window.screen.width - 20
  //     });
  //   }
  // }
}
