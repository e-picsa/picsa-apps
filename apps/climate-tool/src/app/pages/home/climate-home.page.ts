import { Component, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  ISite,
  IChartMeta,
  ICropRequirement
} from '@picsa/core/models/climate.models';
import { select } from '@angular-redux/store';
import * as DATA from 'src/app/data/climate-tool.data';
import { MenuController } from '@ionic/angular';
import { ClimateToolService } from 'src/app/services/climate-tool.service';
// import { ClimateToolActions } from '../../store/climate-tool.actions';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'climate-home',
  templateUrl: './climate-home.page.html',
  styleUrls: ['./climate-home.page.scss']
})
export class ClimateHomePage implements OnDestroy {
  private componentDestroyed: Subject<any> = new Subject();
  // @select(['climate', 'site'])
  // readonly site$: Observable<ISite>;
  // @select(['climate', 'chart'])
  // readonly activeChart$: Observable<IChartMeta>;
  activeChart: IChartMeta;
  sites: any;
  selectedSite: ISite;
  selectedChart: string;
  availableCharts: IChartMeta[] = DATA.availableCharts;
  showTools: boolean = true;
  showDefinition: boolean = false;
  lineToolValue: number;
  probabilities: any;
  crops = DATA.cropRequirements;
  selectedCrop: ICropRequirement;
  fullScreenView: boolean = true;
  columns = [];

  constructor(
    public menuCtrl: MenuController,
    public climateService: ClimateToolService // private actions: ClimateToolActions
  ) {
    this._addSubscriptions();
  }
  ngOnDestroy() {
    this.componentDestroyed.next();
    this.componentDestroyed.unsubscribe();
    // this.actions.resetState();
  }
  _addSubscriptions() {
    // this.site$.pipe(takeUntil(this.componentDestroyed)).subscribe(site => {
    //   if (site) {
    //     this.siteChanged(site);
    //   }
    // });
    // this.activeChart$
    //   .pipe(takeUntil(this.componentDestroyed))
    //   .subscribe(chart => {
    //     if (chart) {
    //       this.activeChart = chart;
    //       // update selected crop to pick new line tool value
    //       if (this.selectedCrop) {
    //         this.setCrop(this.selectedCrop);
    //       }
    //     }
    //   });
  }

  setChart(chart: IChartMeta) {
    // this.actions.selectChart(chart);
  }

  async siteChanged(site: ISite) {
    this.selectedSite = site;
  }

  showAllCharts() {
    this.activeChart = null;
  }
  close() {
    // this.navCtrl.pop();
  }
  selectSite() {
    // this.actions.selectSite(null);
  }
  setAvailableCharts(list) {
    this.availableCharts = DATA.availableCharts;
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
