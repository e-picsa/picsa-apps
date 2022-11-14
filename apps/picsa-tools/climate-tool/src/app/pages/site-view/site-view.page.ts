import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { MediaMatcher } from '@angular/cdk/layout';
import { ClimateChartService } from '../../services/climate-chart.service';

@Component({
  selector: 'climate-site-view',
  templateUrl: './site-view.page.html',
  styleUrls: ['./site-view.page.scss'],
})
export class ClimateSiteViewComponent implements OnInit, OnDestroy {
  private destroyed$: Subject<boolean> = new Subject();

  activeView: string | undefined;

  public showRotateAnimation = false;
  public mobileQuery: MediaQueryList;
  private _mobileQueryListener: () => void;

  constructor(
    public chartService: ClimateChartService,

    private media: MediaMatcher,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private componentsService: PicsaCommonComponentsService
  ) {}

  async ngOnInit() {
    this.subscribeToLayoutChanges();
    await this.setStationFromParams();
    this.subscribeToParamChanges();
    this.promptScreenRotate();
  }
  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
    this.chartService.setStation(undefined);
    this.chartService.setChart(undefined);
  }

  private async setStationFromParams() {
    const siteId = this.route.snapshot.params.siteId;
    const stationMeta = await this.chartService.setStation(siteId);
    const title = stationMeta?.name || `${siteId} no data`;
    this.componentsService.setHeader({ title });
  }

  private promptScreenRotate() {
    if (window.innerHeight > window.innerWidth) {
      this.showRotateAnimation = true;
    }
  }

  private subscribeToLayoutChanges() {
    this.mobileQuery = this.media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => this.cdr.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  private subscribeToParamChanges() {
    this.route.queryParamMap
      .pipe(takeUntil(this.destroyed$))
      .subscribe(async (params) => {
        const viewId = params.get('view');
        await this.chartService.setChart(viewId || undefined);
      });
  }
}
