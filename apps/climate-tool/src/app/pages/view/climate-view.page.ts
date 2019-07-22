import { Component, OnInit } from '@angular/core';
import { ISite, IChartMeta } from '@picsa/models/climate.models';
import * as DATA from 'src/app/data';
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
  // columns = [];

  constructor(
    private climateService: ClimateToolService, // private actions: ClimateToolActions
    private route: ActivatedRoute
  ) {}
  ngOnInit(): void {
    const siteId = this.route.snapshot.params.siteId;
    this.activeSite = DATA.SITES.find(s => s._id == siteId);
  }

  setChart(chart: IChartMeta) {
    this.activeChart = chart;
  }
  unsetChart() {
    this.activeChart = undefined;
  }

  showAllCharts() {
    this.activeChart = null;
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
