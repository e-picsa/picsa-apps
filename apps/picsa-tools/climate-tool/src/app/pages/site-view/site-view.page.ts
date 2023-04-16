import { MediaMatcher } from '@angular/cdk/layout';
import { DomPortal, Portal } from '@angular/cdk/portal';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ClimateShareDialogComponent } from '../../components/share-dialog/share-dialog.component';
import { ClimateChartService } from '../../services/climate-chart.service';

@Component({
  selector: 'climate-site-view',
  templateUrl: './site-view.page.html',
  styleUrls: ['./site-view.page.scss'],
})
export class ClimateSiteViewComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroyed$: Subject<boolean> = new Subject();

  activeView: string | undefined;

  public showRotateAnimation = false;
  public mobileQuery: MediaQueryList;
  private _mobileQueryListener: () => void;
  @ViewChild('headerContent')
  headerContent: ElementRef<HTMLElement>;

  constructor(
    public chartService: ClimateChartService,
    private media: MediaMatcher,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private componentsService: PicsaCommonComponentsService,
    private dialog: MatDialog
  ) {}

  async ngOnInit() {
    this.subscribeToLayoutChanges();
    await this.setStationFromParams();
    this.subscribeToParamChanges();
    this.promptScreenRotate();
  }
  ngAfterViewInit() {
    this.componentsService.patchHeader({
      endContent: new DomPortal(this.headerContent),
    });
  }
  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
    this.chartService.clearChartData();
    this.componentsService.patchHeader({ endContent: undefined });
  }

  /** when toggling sidebar also trigger resize event to ensure chart resizes */
  public handleSidenavChange() {
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }
  async showShareDialog() {
    this.dialog.open(ClimateShareDialogComponent, { disableClose: true });
  }

  private async setStationFromParams() {
    const siteId = this.route.snapshot.params.siteId;
    const stationMeta = await this.chartService.setStation(siteId);
    const title = stationMeta?.name || `${siteId} no data`;
    this.componentsService.patchHeader({ title });
  }

  private promptScreenRotate() {
    if (window.innerHeight > window.innerWidth) {
      this.showRotateAnimation = true;
    }
  }

  /** Use media queries to handle sidenav */
  private subscribeToLayoutChanges() {
    this.mobileQuery = this.media.matchMedia('(max-width: 768px)');
    this._mobileQueryListener = () => this.cdr.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  /** Set chart in climate service by params */
  private subscribeToParamChanges() {
    this.route.queryParamMap.pipe(takeUntil(this.destroyed$)).subscribe(async (params) => {
      const viewId = params.get('view');
      await this.chartService.setChart(viewId || undefined);
    });
  }
}
