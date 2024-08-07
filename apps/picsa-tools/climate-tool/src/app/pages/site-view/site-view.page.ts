import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { IChartId } from '@picsa/models/src';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ClimateShareDialogComponent } from '../../components/share-dialog/share-dialog.component';
import { ClimateChartService } from '../../services/climate-chart.service';
import { ClimateToolService } from '../../services/climate-tool.service';

@Component({
  selector: 'climate-site-view',
  templateUrl: './site-view.page.html',
  styleUrls: ['./site-view.page.scss'],
})
export class ClimateSiteViewComponent implements OnInit, OnDestroy {
  private destroyed$: Subject<boolean> = new Subject();

  activeView: string | undefined;

  public showRotateAnimation = false;
  constructor(
    public chartService: ClimateChartService,
    private toolService: ClimateToolService,
    private route: ActivatedRoute,
    private componentsService: PicsaCommonComponentsService,
    private dialog: MatDialog
  ) {}

  async ngOnInit() {
    await this.setStationFromParams();
    this.subscribeToParamChanges();
    this.promptScreenRotate();
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
    this.chartService.clearChartData();
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

  /** Set chart in climate service by params */
  private subscribeToParamChanges() {
    this.route.queryParamMap.pipe(takeUntil(this.destroyed$)).subscribe((params) => {
      const viewId = params.get('view') as IChartId;
      // clear tools before loading chart
      this.toolService.disableAll();
      setTimeout(async () => {
        await this.chartService.setChart(viewId);
      }, 50);
    });
  }
}
