import { TemplatePortal } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { IChartId } from '@picsa/models/src';
import { _wait } from '@picsa/utils';
import { map } from 'rxjs/operators';

import { ClimateShareDialogComponent } from '../../components/share-dialog/share-dialog.component';
import { ClimateChartService } from '../../services/climate-chart.service';
import { ClimateDataService } from '../../services/climate-data.service';
import { ClimateToolService } from '../../services/climate-tool.service';

interface ISiteViewQueryParams {
  view?: IChartId;
}
interface ISiteViewParams {
  siteId?: string;
}

@Component({
  selector: 'climate-site-view',
  templateUrl: './site-view.page.html',
  styleUrls: ['./site-view.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClimateSiteViewComponent implements OnDestroy, AfterViewInit {
  public showRotateAnimation = false;

  public stationSelectOptions = computed(() => {
    const stations = this.dataService.stations();
    return stations.map(({ id, name }) => ({ value: id, label: name })).sort((a, b) => (a.label > b.label ? 1 : -1));
  });

  private viewId = toSignal(this.route.queryParams.pipe(map(({ view }: ISiteViewQueryParams) => view)));
  private siteId = toSignal(this.route.params.pipe(map(({ siteId }: ISiteViewParams) => siteId)));
  private _siteId: string;

  @ViewChild('headerPortal') headerPortal: TemplateRef<unknown>;
  constructor(
    public chartService: ClimateChartService,
    private dataService: ClimateDataService,
    private toolService: ClimateToolService,
    private route: ActivatedRoute,
    private router: Router,
    private componentsService: PicsaCommonComponentsService,
    private dialog: MatDialog,
    private viewContainer: ViewContainerRef,
    private cdr: ChangeDetectorRef
  ) {
    effect(async () => {
      const viewId = this.viewId();
      const siteId = this.siteId();
      if (siteId && viewId) {
        // same site, just view changed
        if (siteId === this._siteId) {
          await this.loadView(viewId);
        }
        // site changed
        else {
          this._siteId = siteId;
          await this.chartService.setStation(siteId);
          await this.loadView(viewId);
        }
      }

      this.cdr.markForCheck();
    });
  }

  async ngAfterViewInit() {
    this.componentsService.patchHeader({
      cdkPortalCenter: new TemplatePortal(this.headerPortal, this.viewContainer),
    });
    this.promptScreenRotate();
    this.cdr.markForCheck();
  }

  ngOnDestroy() {
    this.chartService.clearChartData();
    this.componentsService.patchHeader({ cdkPortalCenter: undefined });
    this.cdr.markForCheck();
  }

  async showShareDialog() {
    this.dialog.open(ClimateShareDialogComponent, { disableClose: true });
  }

  public async handleStationSelect(id: string) {
    await this.router.navigate(['../', id], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve',
      replaceUrl: true,
    });
    this.cdr.markForCheck();
  }

  private async loadView(viewId: IChartId) {
    this.toolService.disableAll();
    await _wait(50);
    await this.chartService.setChart(viewId);
  }

  private promptScreenRotate() {
    if (window.innerHeight > window.innerWidth) {
      this.showRotateAnimation = true;
    }
  }
}
