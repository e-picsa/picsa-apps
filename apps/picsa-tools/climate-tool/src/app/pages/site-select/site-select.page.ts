import { TemplatePortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
  TemplateRef,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaCommonComponentsService } from '@picsa/components';
import { ConfigurationService } from '@picsa/configuration';
import { ICountryCode } from '@picsa/data';
import { getDeepestLocations, getGeoLocationData, topoJsonToGeoJson } from '@picsa/data/geoLocation';
import { FormLocationSelectComponent } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/i18n';
import { IStationMeta } from '@picsa/models';
import {
  formatHeaderDefault,
  IDataTableOptions,
  PicsaDataTableComponent,
} from '@picsa/shared/features/data-table/data-table.component';
import { IGeoJsonData, IMapMarker, PicsaMapComponent } from '@picsa/shared/features/map/map';

import { ClimateDataService } from '../../services/climate-data.service';
import {
  formatStationLabel,
  getDistrictCenterAndBoundary,
  getStationRecommendations,
  IDistrictCenterResult,
  IStationRecommendation,
} from '../../utils/location-proximity.utils';

const STRINGS = {
  map: translateMarker('Map'),
  list: translateMarker('List'),
  location: translateMarker('Location'),
  chooseLocationDesc: translateMarker('Choose your province and district to see the nearest climate station.'),
  findingStations: translateMarker('Finding closest stations for'),
  recommendedStationFor: translateMarker('Recommended Station for'),
  selectedStationFor: translateMarker('Selected Station for'),
  view: translateMarker('View'),
  otherNearbyStations: translateMarker('Other nearby stations:'),
  allAvailableStations: translateMarker('All Available Stations'),
  hide: translateMarker('Hide'),
  show: translateMarker('Show'),
  selectStationNotice: translateMarker('Select a station to view its climate summary.'),
};

@Component({
  selector: 'climate-site-select',
  templateUrl: './site-select.page.html',
  styleUrls: ['./site-select.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    PicsaDataTableComponent,
    PicsaMapComponent,
    PicsaTranslateModule,
    FormLocationSelectComponent,
  ],
})
export class SiteSelectPage implements AfterViewInit, OnDestroy {
  public dataService = inject(ClimateDataService);
  private configurationService = inject(ConfigurationService);
  private componentsService = inject(PicsaCommonComponentsService);
  private viewContainer = inject(ViewContainerRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public readonly strings = STRINGS;

  public readonly picsaMap = viewChild<PicsaMapComponent>('picsaMap');
  public readonly headerEndPortal = viewChild<TemplateRef<unknown>>('headerEndPortal');

  public readonly userCountryCode = computed(() => this.configurationService.userSettings().country_code);

  /** Active location hierarchy selected by the user: [country, admin_4, admin_5, ...] */
  public readonly selectedLocation = signal<(string | undefined)[]>([]);

  /** Selected district derived from location hierarchy */
  public readonly selectedDistrict = computed(() => {
    const loc = this.selectedLocation();
    const country = this.userCountryCode();
    if (!loc || loc.length === 0 || !country) return undefined;

    const districtId = loc[5] ?? loc[4];
    if (!districtId) return undefined;

    const geoData = getGeoLocationData(country as ICountryCode);
    const deepest = getDeepestLocations(geoData);
    return deepest.find((l) => l.id === districtId);
  });

  /** Selected station on map/table/card */
  public readonly selectedStation = signal<IStationMeta | undefined>(undefined);

  /** Whether the user is viewing the location recommendation panel or map on mobile */
  public readonly view = signal<'recommendation' | 'map'>('recommendation');

  /** Whether the "Browse all country stations" section is expanded */
  public readonly showAllStations = signal(false);

  /** Computed recommendations for the selected district */
  public readonly stationRecommendations = signal<IStationRecommendation[]>([]);

  /** Centroid calculation & boundary resolution state */
  public readonly isCalculatingProximity = signal(false);
  public readonly districtCenterResult = signal<IDistrictCenterResult | undefined>(undefined);

  /** Primary recommendation (first in ranked list) */
  public readonly primaryRecommendation = computed(() => this.stationRecommendations()[0]);

  /** Alternative recommended stations */
  public readonly alternativeRecommendations = computed(() =>
    this.stationRecommendations()
      .slice(1, 4)
      .map((rec) => ({
        ...rec,
        station: { ...rec.station, name: formatStationLabel(rec.station.name) },
      })),
  );

  /** Currently displayed station (either explicitly selected or primary recommendation) */
  public readonly displayedStation = computed(() => {
    const selected = this.selectedStation();
    if (selected) {
      return {
        station: { ...selected, name: formatStationLabel(selected.name) },
        isPrimary: selected.id === this.primaryRecommendation()?.station.id,
      };
    }
    const primary = this.primaryRecommendation();
    if (primary) {
      return {
        station: { ...primary.station, name: formatStationLabel(primary.station.name) },
        isPrimary: true,
      };
    }
    return undefined;
  });

  /** Station currently active on mobile or map card */
  public readonly activeStation = computed(() => this.displayedStation()?.station);

  public readonly mapReady = signal(false);

  /** All country stations sorted alphabetically by district, then by name */
  public readonly sortedAllStations = computed(() => {
    const stations = this.dataService.allStations();
    return [...stations].sort((a, b) => {
      const distA = a.location?.[0] || '';
      const distB = b.location?.[0] || '';
      const cmpDist = distA.localeCompare(distB);
      if (cmpDist !== 0) return cmpDist;
      return a.name.localeCompare(b.name);
    });
  });

  public readonly mapMarkers = computed(() => {
    const stations = this.sortedAllStations();
    const markers: IMapMarker[] = stations
      .filter((s) => s.latitude !== null && s.longitude !== null)
      .map((station, _index) => ({
        latlng: [station.latitude, station.longitude] as [number, number],
        data: station,
        number: _index + 1,
        label: formatStationLabel(station.name),
        _index,
      }));
    return markers;
  });

  public readonly tableData = computed(() => {
    const stations = this.sortedAllStations();
    return stations.map((station, index) => {
      const district = station.location?.[0] || '—';
      return {
        ...station,
        name: formatStationLabel(station.name),
        district,
        map: index + 1,
      };
    });
  });

  public readonly tableOptions = computed(() => {
    const country_code = this.userCountryCode();
    const geoData = getGeoLocationData(country_code);
    return {
      displayColumns: ['map', 'name', 'district'],
      formatHeader: (v) => {
        if (v === 'district') return geoData.admin_4.label;
        return formatHeaderDefault(v);
      },
      sort: { id: 'district', start: 'asc' },
    } satisfies IDataTableOptions;
  });

  constructor() {
    // Seed location from user settings if available
    const savedLocation = this.configurationService.userSettings().location;
    if (savedLocation && savedLocation.length > 0) {
      this.selectedLocation.set(savedLocation);
    }

    // Effect: Load country admin boundaries when map and country are ready
    effect(() => {
      const picsaMap = this.picsaMap();
      const country_code = this.userCountryCode();
      const mapReady = this.mapReady();
      if (picsaMap && mapReady && country_code) {
        this.loadCountryAdminBoundaries(picsaMap, country_code).catch((err) => {
          console.warn('[SiteSelect] Could not load country admin boundaries:', err);
        });
      }
    });

    // Effect: Check for temporary preferred station when returning from chart view
    effect(() => {
      const picsaMap = this.picsaMap();
      const mapReady = this.mapReady();
      const markers = this.mapMarkers();
      if (picsaMap && mapReady && markers && markers.length > 0) {
        this.checkTmpPreferredStation().catch((err) => {
          console.warn('[SiteSelect] Could not check preferred station:', err);
        });
      }
    });

    // Effect: Calculate district centroid and station proximity whenever selectedDistrict changes
    let latestDistrictReqId = 0;
    effect(() => {
      const district = this.selectedDistrict();
      const countryCode = this.userCountryCode();
      const allStations = this.dataService.allStations();

      if (!district || !countryCode) {
        this.stationRecommendations.set([]);
        this.districtCenterResult.set(undefined);
        this.isCalculatingProximity.set(false);
        return;
      }

      const reqId = ++latestDistrictReqId;
      this.isCalculatingProximity.set(true);

      getDistrictCenterAndBoundary(countryCode as ICountryCode, district.id)
        .then((result) => {
          if (reqId !== latestDistrictReqId) return; // Stale request, ignore
          this.districtCenterResult.set(result);

          if (result?.center) {
            const recommendations = getStationRecommendations(allStations, result.center, district.label, district.id);
            this.stationRecommendations.set(recommendations);

            // Automatically select the recommended station
            if (recommendations.length > 0) {
              this.selectedStation.set(recommendations[0].station);
            }
          }
        })
        .catch((err) => {
          console.error('[SiteSelect] Error computing district proximity:', err);
        })
        .finally(() => {
          if (reqId === latestDistrictReqId) {
            this.isCalculatingProximity.set(false);
          }
        });
    });

    // Effect: Highlight district boundary on map when map is ready and boundary feature exists
    effect(() => {
      const picsaMap = this.picsaMap();
      const mapReady = this.mapReady();
      const result = this.districtCenterResult();
      if (picsaMap && mapReady && result?.feature) {
        // District boundary overlay without fitting bounds (camera focuses on recommended station)
        picsaMap.addGeoJsonLayer('selected-district-boundary', result.feature, {
          lineColor: '#16a34a',
          lineWidth: 3,
          lineOpacity: 0.9,
          fitBounds: false,
        });
      }
    });

    // Effect: Sync active map marker and flyTo at offline-safe zoom (8) when selectedStation changes
    effect(() => {
      const selectedStation = this.selectedStation();
      const picsaMap = this.picsaMap();
      const mapReady = this.mapReady();
      if (selectedStation && picsaMap && mapReady) {
        this.handleStationSelected(selectedStation, picsaMap);
      }
    });
  }

  ngAfterViewInit() {
    const endPortal = this.headerEndPortal();
    if (endPortal) {
      this.componentsService.patchHeader({
        cdkPortalEnd: new TemplatePortal(endPortal, this.viewContainer),
      });
    }
  }

  ngOnDestroy() {
    this.componentsService.patchHeader({
      cdkPortalEnd: undefined,
    });
  }

  public toggleView() {
    const nextView = this.view() === 'recommendation' ? 'map' : 'recommendation';
    this.view.set(nextView);
    if (nextView === 'map') {
      setTimeout(() => {
        const picsaMap = this.picsaMap();
        if (picsaMap) {
          picsaMap.resize();
          const station = this.selectedStation();
          if (station) {
            const marker = this.mapMarkers().find((m) => m.data?.id === station.id);
            if (marker) {
              picsaMap.setActiveMarker(marker, true);
            }
          }
        }
      }, 50);
    }
  }

  public toggleAllStations() {
    this.showAllStations.update((val) => !val);
  }

  public handleLocationChanged(location: (string | undefined)[]) {
    this.selectedLocation.set(location);
    // If complete location with district is selected, persist to userSettings
    const districtId = location[5] ?? location[4];
    if (districtId) {
      this.configurationService.updateUserSettings({ location });
    }
  }

  public selectAlternateStation(recommendation: IStationRecommendation) {
    this.selectedStation.set(recommendation.station);
  }

  public confirmAndNavigate(station: IStationMeta) {
    // Persist location & preferred station
    const loc = this.selectedLocation();
    if (loc && loc.length > 0) {
      this.configurationService.updateUserSettings({ location: loc });
    }
    this.dataService.setPreferredStation(station.id);
    this.goToSite(station);
  }

  public goToSite(site: IStationMeta) {
    this.router.navigate(['./', site.id], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        view: 'rainfall',
      },
    });
  }

  public handleRowClick(station: IStationMeta) {
    if (station?.id) {
      if (station.id === this.selectedStation()?.id) {
        this.confirmAndNavigate(station);
      } else {
        this.selectedStation.set(station);
      }
    }
  }

  public handleMarkerClick(e: IMapMarker) {
    if (e?.data) {
      this.selectedStation.set(e.data);
    }
  }

  private handleStationSelected(selectedStation: IStationMeta, picsaMap: PicsaMapComponent) {
    const marker = this.mapMarkers().find((m) => m.data?.id === selectedStation.id);
    if (marker) {
      picsaMap.setActiveMarker(marker, true);
    }
  }

  private async checkTmpPreferredStation() {
    const tmpStation = localStorage.getItem('picsa_climate_station_temp');
    if (tmpStation) {
      localStorage.removeItem('picsa_climate_station_temp');
      const marker = this.mapMarkers().find((v) => v.data?.id === tmpStation);
      if (marker?.data) {
        this.selectedStation.set(marker.data);
      }
    }
  }

  /**
   * Load and render country administrative boundaries onto the MapLibre map.
   */
  private async loadCountryAdminBoundaries(picsaMap: PicsaMapComponent, countryCode: ICountryCode): Promise<void> {
    try {
      const geoData = getGeoLocationData(countryCode);
      const topoJson = await geoData.topoJson();
      const adminGeoJson: IGeoJsonData = topoJsonToGeoJson(topoJson, 'input');

      picsaMap.addGeoJsonLayer('country-admin-boundaries', adminGeoJson, {
        lineColor: '#64748b',
        lineWidth: 1.5,
        lineOpacity: 0.6,
        fillColor: '#94a3b8',
        fillOpacity: 0.05,
      });
    } catch (err) {
      console.warn(`[SiteSelect] Could not render country admin boundaries for ${countryCode}:`, err);
    }
  }
}
