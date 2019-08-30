import { Component, OnInit, OnDestroy } from '@angular/core';
import { IChartMeta, IStationMeta } from '@picsa/models/climate.models';
import * as DATA from '@picsa/climate/src/app/data';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ClimateToolService } from '@picsa/climate/src/app/services/climate-tool.service';
import { IClimateView } from '../../models';

@Component({
  selector: 'climate-site-view',
  templateUrl: './site-view.page.html',
  styleUrls: ['./site-view.page.scss']
})
export class ClimateSiteViewPage implements OnInit, OnDestroy {
  destroyed$: Subject<boolean> = new Subject();
  activeStation: IStationMeta;
  activeChart: IChartMeta;
  availableViews = [...DATA.CHART_TYPES, ...DATA.REPORT_TYPES];
  activeView: string;
  availableCharts: IChartMeta[] = DATA.CHART_TYPES;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private climateService: ClimateToolService
  ) {}
  ngOnInit(): void {
    // readily subscribe to view changes to avoid flash of site-select page
    this._subscribeToViewChanges();
    this.loadSiteData();
  }
  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }
  async loadSiteData() {
    const siteId = this.route.snapshot.params.siteId;
    this.activeStation = await this.climateService.loadStation(siteId);
  }
  changeSite() {
    this.router.navigate(['/'], {
      relativeTo: this.route
    });
  }

  setView(view: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view: view }
    });
    // this.activeChart = view as IChartMeta;
  }

  private _subscribeToViewChanges() {
    this.route.queryParamMap
      .pipe(takeUntil(this.destroyed$))
      .subscribe(params => {
        const view = this.availableViews.find(
          v => v._viewID === params.get('view')
        );
        this.activeView = view ? view._viewID : undefined;
        this.activeChart =
          view && view._viewType === 'chart' ? (view as IChartMeta) : undefined;
      });
    console.log('view changed', this.activeView, this.activeChart);
  }
}
