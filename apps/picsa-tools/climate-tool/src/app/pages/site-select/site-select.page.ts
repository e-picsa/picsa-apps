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
import { getDeepestLocations, getGeoLocationData } from '@picsa/data/geoLocation';
import { FormLocationSelectComponent } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/i18n';
import { IStationMeta } from '@picsa/models';
import {
  formatHeaderDefault,
  IDataTableOptions,
  PicsaDataTableComponent,
} from '@picsa/shared/features/data-table/data-table.component';
import { IMapMarker, PicsaMapComponent } from '@picsa/shared/features/map/map';

import { ClimateDataService } from '../../services/climate-data.service';
import {
  formatStationLabel,
  getCombinedDistrictAndStationBounds,
  getDistrictCenterAndBoundary,
  getStationRecommendations,
  IDistrictCenterResult,
  IStationRecommendation,
} from '../../utils/location-proximity.utils';

const STRINGS = {
  map: translateMarker('Map'),
  list: translateMarker('List'),
  location: translateMarker('Location'),
  view: translateMarker('View'),
  allStations: translateMarker('All Stations'),
  recommended: translateMarker('Recommended'),
  nearby: translateMarker('Nearby'),
  findingStations: translateMarker('Finding closest stations'),
};

// eslint-disable-next-line @angular-eslint/component-class-suffix
@Component({
  selector: 'climate-site-select',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    PicsaTranslateModule,
    FormLocationSelectComponent,
    PicsaDataTableComponent,
    PicsaMapComponent,
  ],
  templateUrl: './site-select.page.html',
  styleUrls: ['./site-select.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteSelectPage implements AfterViewInit, OnDestroy {
  public readonly strings = STRINGS;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public readonly dataService = inject(ClimateDataService);
  private configurationService = inject(ConfigurationService);
  private componentsService = inject(PicsaCommonComponentsService);
  private viewContainer = inject(ViewContainerRef);

  public readonly headerEndPortal = viewChild<TemplateRef<unknown>>('headerEndPortal');
  public readonly picsaMap = viewChild(PicsaMapComponent);

  /** User country code from active configuration/settings */
  public readonly userCountryCode = computed(() => {
    return this.configurationService.userSettings().country_code;
  });

  /** Selected [country, admin_1, ..., admin_n] from form-location-select */
  public readonly selectedLocation = signal<(string | undefined)[]>([]);

  /** Map readiness flag bound from picsa-map */
  public readonly mapReady = signal(false);

  /** Deepest selected location entry (district) */
  public readonly selectedDistrict = computed(() => {
    const loc = this.selectedLocation();
    const country = this.userCountryCode();
    if (!country || !loc || loc.length === 0) return undefined;

    const districtId = loc[5] ?? loc[4];
    if (!districtId) return undefined;

    const geoData = getGeoLocationData(country as ICountryCode);
    const deepest = getDeepestLocations(geoData);
    return deepest.find((l) => l.id === districtId);
  });

  /** Selected station on map/table/card */
  public readonly selectedStation = signal<IStationMeta | undefined>(undefined);

  /** Whether the user is viewing the map or list on mobile (default is map) */
  public readonly view = signal<'recommendation' | 'map'>('map');

  /** Ranked stations by proximity to district center */
  public readonly stationRecommendations = signal<IStationRecommendation[]>([]);

  /** Resolved center coordinates & feature boundary of the selected district */
  public readonly districtCenterResult = signal<IDistrictCenterResult | undefined>(undefined);

  public readonly isCalculatingProximity = signal(false);

  /** Whether the full stations data table is expanded */
  public readonly showAllStations = signal(false);

  /** Bounding box combining the selected district feature and the recommended station */
  public readonly districtAndStationBounds = computed(() => {
    const result = this.districtCenterResult();
    const primary = this.primaryRecommendation();
    if (!result) return undefined;
    return getCombinedDistrictAndStationBounds(result.feature, primary?.station, result.center);
  });

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

  /** Active station for floating mobile card */
  public readonly activeStation = computed(() => this.displayedStation()?.station);

  /** All country stations sorted alphabetically by district, then by station name */
  public readonly sortedAllStations = computed(() => {
    const stations = this.dataService.allStations();
    return [...stations].sort((a, b) => {
      const distA = a.location?.[0] || '';
      const distB = b.location?.[0] || '';
      const distCmp = distA.localeCompare(distB);
      if (distCmp !== 0) return distCmp;
      return a.name.localeCompare(b.name);
    });
  });

  /** Markers prepared for PicsaMapComponent */
  public readonly mapMarkers = computed<IMapMarker[]>(() => {
    const stations = this.sortedAllStations();
    return stations.map((station, index) => ({
      latlng: [station.latitude, station.longitude],
      number: index + 1,
      label: formatStationLabel(station.name),
      data: station,
      _index: index,
    }));
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
    const initialLocation = this.configurationService.userSettings().location;
    if (initialLocation && initialLocation.length > 0) {
      this.selectedLocation.set(initialLocation);
    }

    // Effect: Whenever selectedDistrict changes, asynchronously compute recommendations & boundary
    let latestDistrictReqId = 0;
    effect(() => {
      const district = this.selectedDistrict();
      const countryCode = this.userCountryCode();
      const allStations = this.dataService.allStations();
      const picsaMap = this.picsaMap();
      const mapReady = this.mapReady();

      if (!district || !countryCode) {
        this.stationRecommendations.set([]);
        this.districtCenterResult.set(undefined);
        this.isCalculatingProximity.set(false);
        this.selectedStation.set(undefined);
        if (picsaMap && mapReady) {
          picsaMap.clearActiveMarker();
          picsaMap.removeGeoJsonLayer('selected-district-boundary');
        }
        return;
      }

      const reqId = ++latestDistrictReqId;
      this.isCalculatingProximity.set(true);
      this.districtCenterResult.set(undefined);
      this.selectedStation.set(undefined);
      if (picsaMap && mapReady) {
        picsaMap.clearActiveMarker();
        picsaMap.removeGeoJsonLayer('selected-district-boundary');
      }

      getDistrictCenterAndBoundary(countryCode as ICountryCode, district.id)
        .then((result) => {
          if (reqId !== latestDistrictReqId) return;
          this.isCalculatingProximity.set(false);
          this.districtCenterResult.set(result);

          if (result) {
            const recommendations = getStationRecommendations(allStations, result.center, district.label, district.id);
            this.stationRecommendations.set(recommendations);

            const recStation = recommendations[0]?.station;
            if (recStation) {
              this.selectedStation.set(recStation);
            }

            const currentMap = this.picsaMap();
            if (currentMap && this.mapReady()) {
              if (result.feature) {
                currentMap.addGeoJsonLayer('selected-district-boundary', result.feature, {
                  lineColor: '#16a34a',
                  lineWidth: 3,
                  lineOpacity: 0.9,
                  fitBounds: false,
                });
              }

              const bounds = getCombinedDistrictAndStationBounds(result.feature, recStation, result.center);
              if (bounds) {
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                currentMap.fitBounds(bounds, {
                  maxZoom: 8,
                  padding: isMobile
                    ? { top: 90, bottom: 90, left: 30, right: 30 }
                    : { top: 40, bottom: 40, left: 40, right: 40 },
                });
              }

              if (recStation) {
                const marker = this.mapMarkers().find((m) => m.data?.id === recStation.id);
                if (marker) {
                  currentMap.setActiveMarker(marker, false, false);
                }
              }
            }
          }
        })
        .catch((err) => {
          if (reqId !== latestDistrictReqId) return;
          this.isCalculatingProximity.set(false);
          this.districtCenterResult.set(undefined);
          this.stationRecommendations.set([]);
          console.warn('[SiteSelect] Could not resolve district proximity boundary:', err);
        });
    });

    // Effect: Synchronize boundary, bounds, and recommended marker once map becomes ready
    let lastRenderedForMapDistrictId: string | undefined;
    effect(() => {
      const picsaMap = this.picsaMap();
      const mapReady = this.mapReady();
      const district = this.selectedDistrict();
      const result = this.districtCenterResult();
      const primaryRec = this.primaryRecommendation();

      if (!picsaMap || !mapReady || !district || !result) {
        if (!district) lastRenderedForMapDistrictId = undefined;
        return;
      }
      if (lastRenderedForMapDistrictId === district.id) return;
      lastRenderedForMapDistrictId = district.id;

      if (result.feature) {
        picsaMap.addGeoJsonLayer('selected-district-boundary', result.feature, {
          lineColor: '#16a34a',
          lineWidth: 3,
          lineOpacity: 0.9,
          fitBounds: false,
        });
      }

      const bounds = this.districtAndStationBounds();
      if (bounds) {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        picsaMap.fitBounds(bounds, {
          maxZoom: 8,
          padding: isMobile
            ? { top: 90, bottom: 90, left: 30, right: 30 }
            : { top: 40, bottom: 40, left: 40, right: 40 },
        });
      }

      if (primaryRec?.station) {
        const marker = this.mapMarkers().find((m) => m.data?.id === primaryRec.station.id);
        if (marker) {
          picsaMap.setActiveMarker(marker, false, false);
        }
      }
    });
  }

  ngAfterViewInit() {
    const portal = this.headerEndPortal();
    if (portal) {
      this.componentsService.header?.setEndPortal(new TemplatePortal(portal, this.viewContainer));
    }
  }

  ngOnDestroy() {
    this.componentsService.header?.clearEndPortal();
  }

  public toggleView() {
    this.view.update((v) => (v === 'map' ? 'recommendation' : 'map'));
  }

  public toggleAllStations() {
    this.showAllStations.update((v) => !v);
  }

  public handleLocationChanged(location: (string | undefined)[]) {
    this.selectedLocation.set(location);
    this.districtCenterResult.set(undefined);
    this.selectedStation.set(undefined);
    this.stationRecommendations.set([]);
    const picsaMap = this.picsaMap();
    if (picsaMap && this.mapReady()) {
      picsaMap.clearActiveMarker();
      picsaMap.removeGeoJsonLayer('selected-district-boundary');
    }
    // If complete location with district is selected, persist to userSettings
    const districtId = location[5] ?? location[4];
    if (districtId) {
      this.configurationService.updateUserSettings({ location });
    }
  }

  public selectAlternateStation(recommendation: IStationRecommendation) {
    this.selectedStation.set(recommendation.station);
    const picsaMap = this.picsaMap();
    if (picsaMap && this.mapReady()) {
      const marker = this.mapMarkers().find((m) => m.data?.id === recommendation.station.id);
      if (marker) {
        picsaMap.setActiveMarker(marker, false, true);
      }
    }
  }

  public confirmAndNavigate(station: IStationMeta) {
    this.dataService.setPreferredStation(station.id);
    this.router.navigate(['./', station.id], { relativeTo: this.route });
  }

  public handleRowClick(row: IStationMeta) {
    if (!row) return;
    const station = this.dataService.allStations().find((s) => s.id === row.id);
    if (station) {
      if (station.id === this.selectedStation()?.id) {
        this.confirmAndNavigate(station);
      } else {
        this.selectedStation.set(station);
        const picsaMap = this.picsaMap();
        if (picsaMap && this.mapReady()) {
          const marker = this.mapMarkers().find((m) => m.data?.id === station.id);
          if (marker) {
            picsaMap.setActiveMarker(marker, false, true);
          }
        }
      }
    }
  }

  public handleMarkerClick(e: IMapMarker) {
    if (e?.data) {
      this.selectedStation.set(e.data);
    }
  }

  public selectStation(stationName: string) {
    if (stationName) {
      const tmpStation = stationName.replace(' ', '_').toLowerCase();
      const marker = this.mapMarkers().find((v) => v.data?.id === tmpStation);
      if (marker?.data) {
        this.selectedStation.set(marker.data);
        const picsaMap = this.picsaMap();
        if (picsaMap && this.mapReady()) {
          picsaMap.setActiveMarker(marker, false, true);
        }
      }
    }
  }
}
