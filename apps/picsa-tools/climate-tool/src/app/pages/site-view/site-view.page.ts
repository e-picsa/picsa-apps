import { TemplatePortal } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components';
import { PicsaSidenavComponent } from '@picsa/components/picsa-sidenav.component';
import { ConfigurationService } from '@picsa/configuration';
import { ICountryCode } from '@picsa/data';
import { getDeepestLocations, getGeoLocationData } from '@picsa/data/geoLocation';
import { PicsaTranslateModule } from '@picsa/i18n';
import { IChartId } from '@picsa/models';
import { map } from 'rxjs/operators';

import { ClimateChartLayoutComponent } from '../../components/chart-layout/chart-layout';
import { ClimateChartOptionsComponent } from '../../components/climate-chart-options/climate-chart-options.component';
import { PicsaClimateMaterialModule } from '../../components/material.module';
import { ClimatePrintLayoutComponent } from '../../components/print-layout/print-layout.component';
import { ClimateChartService } from '../../services/climate-chart.service';
import { ClimateDataService } from '../../services/climate-data.service';

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
  imports: [
    PicsaClimateMaterialModule,
    PicsaTranslateModule,
    ClimateChartOptionsComponent,
    ClimateChartLayoutComponent,
    ClimatePrintLayoutComponent,
    PicsaSidenavComponent,
  ],
})
export class ClimateSiteViewComponent implements OnDestroy, AfterViewInit {
  chartService = inject(ClimateChartService);
  private dataService = inject(ClimateDataService);
  private configurationService = inject(ConfigurationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private componentsService = inject(PicsaCommonComponentsService);
  private viewContainer = inject(ViewContainerRef);

  readonly stationSelectOptions = computed(() => {
    const stations = this.dataService.stations();
    return stations
      .map(({ id, name, draft }) => ({ value: id, label: name, draft }))
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  });

  readonly districtLabel = computed(() => {
    const country = this.configurationService.userSettings().country_code;
    if (!country) return undefined;

    const geoData = getGeoLocationData(country as ICountryCode);
    const deepest = getDeepestLocations(geoData);

    // 1. If active station specifies a matching district location tag, use it
    const station = this.chartService.station();
    if (station?.location && station.location.length > 0) {
      const match = deepest.find((d) =>
        station.location.some(
          (loc) => loc.toLowerCase() === d.label.toLowerCase() || loc.toLowerCase() === d.id.toLowerCase(),
        ),
      );
      if (match) return match.label;
    }

    // 2. Fall back to user profile location
    const location = this.configurationService.userSettings().location;
    if (!location) return undefined;
    const districtId = location[5] ?? location[4];
    if (!districtId) return undefined;
    return deepest.find((l) => l.id === districtId)?.label;
  });

  private viewId = toSignal(this.route.queryParams.pipe(map(({ view }: ISiteViewQueryParams) => view)));
  private siteId = toSignal(this.route.params.pipe(map(({ siteId }: ISiteViewParams) => siteId)));

  @ViewChild('headerPortal') headerPortal: TemplateRef<unknown>;

  constructor() {
    effect(() => {
      const viewId = this.viewId();
      const siteId = this.siteId();
      // Watch the stations list to trigger validation if country or stations list changes
      this.dataService.stations();

      this.chartService.loadStationAndChart(siteId, viewId);
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
  }

  public async handleStationSelect(id: string) {
    await this.router.navigate(['../', id], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve',
      replaceUrl: true,
    });
  }

  goToSiteSelect() {
    this.chartService.goToSiteSelect(this.siteId() as string);
  }
}
