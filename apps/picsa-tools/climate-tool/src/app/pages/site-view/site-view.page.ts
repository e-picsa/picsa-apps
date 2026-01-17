import { TemplatePortal } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { IChartId } from '@picsa/models/src';
import { _wait } from '@picsa/utils';
import { map } from 'rxjs/operators';

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
  standalone: false,
})
export class ClimateSiteViewComponent implements OnDestroy, AfterViewInit {
  chartService = inject(ClimateChartService);
  private dataService = inject(ClimateDataService);
  private toolService = inject(ClimateToolService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private componentsService = inject(PicsaCommonComponentsService);
  private viewContainer = inject(ViewContainerRef);
  private cdr = inject(ChangeDetectorRef);

  public showRotateAnimation = signal(false);

  public stationSelectOptions = computed(() => {
    const stations = this.dataService.stations();
    return stations
      .map(({ id, name, draft }) => ({ value: id, label: name, draft }))
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  });

  private viewId = toSignal(this.route.queryParams.pipe(map(({ view }: ISiteViewQueryParams) => view)));
  private siteId = toSignal(this.route.params.pipe(map(({ siteId }: ISiteViewParams) => siteId)));
  private _siteId: string;

  @ViewChild('headerPortal') headerPortal: TemplateRef<unknown>;
  constructor() {
    effect(async () => {
      const viewId = this.viewId() || 'rainfall';
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
          await _wait(50);
          this.checkOrientation();
        }
      }

      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit() {
    this.componentsService.patchHeader({
      cdkPortalCenter: new TemplatePortal(this.headerPortal, this.viewContainer),
    });
  }

  ngOnDestroy() {
    this.chartService.clearChartData();
    this.componentsService.patchHeader({ cdkPortalCenter: undefined });
    this.cdr.markForCheck();
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

  private checkOrientation() {
    const shouldRotate = window.innerHeight > window.innerWidth;
    this.showRotateAnimation.set(shouldRotate);
  }

  goToSiteSelect() {
    // Store preferred to temp to allow map to also load (need to remove from config to prevent redirect)
    localStorage.setItem('picsa_climate_station_temp', `${this.siteId()}`);
    // Clear the preferred station to prevent automatic redirect
    this.dataService.setPreferredStation('');
    this.router.navigate(['../'], {
      replaceUrl: true,
      relativeTo: this.route,
    });
  }
}
