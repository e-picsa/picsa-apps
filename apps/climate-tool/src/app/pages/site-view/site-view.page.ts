import { Component, OnInit, OnDestroy } from '@angular/core';
import { ISite, IChartMeta } from '@picsa/models/climate.models';
import * as DATA from 'src/app/data';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'climate-site-view',
  templateUrl: './site-view.page.html',
  styleUrls: ['./site-view.page.scss']
})
export class ClimateSiteViewPage implements OnInit, OnDestroy {
  destroyed$: Subject<boolean> = new Subject();
  activeSite: ISite;
  activeChart: IChartMeta;
  availableViews = [...DATA.CHART_TYPES, ...DATA.REPORT_TYPES];
  activeView: string;
  availableCharts: IChartMeta[] = DATA.CHART_TYPES;
  // columns = [];

  constructor(private route: ActivatedRoute, private router: Router) {}
  ngOnInit(): void {
    const siteId = this.route.snapshot.params.siteId;
    this.activeSite = DATA.STATIONS.find(s => s._key == siteId);
    this._subscribeToViewChanges();
  }
  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

  setView(viewID: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view: viewID }
    });
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
