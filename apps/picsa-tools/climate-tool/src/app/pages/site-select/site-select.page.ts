import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
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
import { IMapMarker, PicsaMapComponent } from '@picsa/shared/features/map/map';
import { _wait } from '@picsa/utils/browser.utils';

import { ClimateDataService } from '../../services/climate-data.service';
import {
  calculateHaversineDistanceKm,
  getDistrictCenterAndBoundary,
  getStationRecommendations,
  IDistrictCenterResult,
  isStationInDistrict,
  IStationRecommendation,
} from '../../utils/location-proximity.utils';

const STRINGS = {
  showMap: translateMarker('Show Map'),
  showLocation: translateMarker('Show Location'),
  selectLocation: translateMarker('Select Location'),
  chooseLocationDesc: translateMarker('Choose your province and district to see the nearest climate station.'),
  findingStations: translateMarker('Finding closest stations for'),
  recommendedStationFor: translateMarker('Recommended Station for'),
  selectedStationFor: translateMarker('Selected Station for'),
  inside: translateMarker('Inside'),
  fromCenter: translateMarker('from center'),
  viewClimateData: translateMarker('View Climate Data'),
  otherNearbyStations: translateMarker('Other nearby stations:'),
  years: translateMarker('years'),
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
export class SiteSelectPage {
  public dataService = inject(ClimateDataService);
  private configurationService = inject(ConfigurationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public readonly strings = STRINGS;

  public readonly picsaMap = viewChild<PicsaMapComponent>('picsaMap');

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

  /** Whether all stations table is expanded */
  public readonly showAllStations = signal<boolean>(false);

  /** Flag while computing district center / station proximity */
  public readonly isCalculatingProximity = signal<boolean>(false);

  /** Station recommendations ranked by proximity to active district */
  public readonly stationRecommendations = signal<IStationRecommendation[]>([]);

  /** Centroid and boundary of currently selected district */
  public readonly districtCenterResult = signal<IDistrictCenterResult | undefined>(undefined);

  /** Primary recommended station */
  public readonly primaryRecommendation = computed(() => this.stationRecommendations()[0]);

  /** Alternative nearby stations (next 3 recommendations) */
  public readonly alternativeRecommendations = computed(() => this.stationRecommendations().slice(1, 4));

  /** Currently displayed station (either explicitly selected or primary recommendation) */
  public readonly displayedStation = computed(() => {
    const selected = this.selectedStation();
    if (selected) {
      const rec = this.stationRecommendations().find((r) => r.station.id === selected.id);
      return {
        station: selected,
        distanceKm: rec ? rec.distanceKm : this.getStationDistance(selected),
        isInsideDistrict: rec ? rec.isInsideDistrict : this.isStationInDistrict(selected),
        isPrimary: rec ? rec.station.id === this.primaryRecommendation()?.station.id : false,
      };
    }
    const primary = this.primaryRecommendation();
    if (primary) {
      return {
        station: primary.station,
        distanceKm: primary.distanceKm,
        isInsideDistrict: primary.isInsideDistrict,
        isPrimary: true,
      };
    }
    return undefined;
  });

  /** Station currently active on mobile or map card */
  public readonly activeStation = computed(() => this.displayedStation()?.station);

  public readonly mapReady = signal(false);

  public readonly mapMarkers = computed(() => {
    const stations = this.dataService.stations();
    const markers: IMapMarker[] = stations
      .filter((s) => s.latitude !== null && s.longitude !== null && !s.draft)
      .map((station, _index) => ({
        latlng: [station.latitude, station.longitude] as [number, number],
        data: station,
        number: _index + 1,
        label: station.name,
        _index,
      }));
    return markers;
  });

  public readonly tableData = computed(() => {
    const stations = this.dataService.stations();
    return stations.map((station, index) => {
      return { ...station, map: index + 1 };
    });
  });

  public readonly tableOptions = computed(() => {
    const country_code = this.userCountryCode();
    const geoData = getGeoLocationData(country_code);
    return {
      displayColumns: ['map', 'name', 'location'],
      formatHeader: (v) => {
        if (v === 'location') return geoData.admin_4.label;
        return formatHeaderDefault(v);
      },
      sort: { id: 'location', start: 'asc' },
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
      const allStations = this.dataService.stations();

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

            // Default selected station to primary recommendation if none currently selected
            const currentSelected = untracked(() => this.selectedStation());
            if (!currentSelected || !recommendations.some((r) => r.station.id === currentSelected.id)) {
              this.selectedStation.set(recommendations[0]?.station);
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
        picsaMap.addGeoJsonLayer('selected-district-boundary', result.feature, {
          lineColor: '#16a34a',
          lineWidth: 3,
          lineOpacity: 0.9,
          fitBounds: true,
          padding: 40,
        });
      }
    });

    // Effect: Sync active map marker when selectedStation changes
    effect(() => {
      const selectedStation = this.selectedStation();
      const picsaMap = this.picsaMap();
      const mapReady = this.mapReady();
      if (selectedStation && picsaMap && mapReady) {
        this.handleStationSelected(selectedStation, picsaMap);
      }
    });
  }

  public toggleView() {
    this.view.set(this.view() === 'recommendation' ? 'map' : 'recommendation');
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

  public isStationInDistrict(station?: IStationMeta): boolean {
    if (!station) return false;
    const district = this.selectedDistrict();
    return isStationInDistrict(station, district?.label, district?.id);
  }

  public getStationDistance(station?: IStationMeta): number | undefined {
    if (!station) return undefined;
    const rec = this.stationRecommendations().find((r) => r.station.id === station.id);
    if (rec) return rec.distanceKm;
    const center = this.districtCenterResult()?.center;
    if (center && station.latitude && station.longitude) {
      return calculateHaversineDistanceKm(center.lat, center.lng, station.latitude, station.longitude);
    }
    return undefined;
  }

  public handleMarkerClick(e: IMapMarker) {
    if (e?.data) {
      this.selectedStation.set(e.data);
    }
  }

  private handleStationSelected(selectedStation: IStationMeta, picsaMap: PicsaMapComponent) {
    const marker = this.mapMarkers().find((m) => m.data?.id === selectedStation.id);
    if (marker) {
      picsaMap.setActiveMarker(marker);
    }
  }

  private async checkTmpPreferredStation() {
    const tmpStation = localStorage.getItem('picsa_climate_station_temp');
    if (tmpStation) {
      localStorage.removeItem('picsa_climate_station_temp');
      const marker = this.mapMarkers().find((v) => v.data?.id === tmpStation);
      if (marker) {
        await _wait(500);
        this.selectedStation.set(marker.data);
      }
    }
  }

  private async loadCountryAdminBoundaries(picsaMap: PicsaMapComponent, country_code: string) {
    const geoData = getGeoLocationData(country_code as ICountryCode);
    const topojson = await geoData.topoJson();
    // In our TopoJSON files, admin level 4/5/6 is available depending on the country
    // Level 4 (provinces / Malawi districts) gives the clean overview boundary layer
    const geojson = topoJsonToGeoJson(topojson, '4');
    picsaMap.addGeoJsonLayer('admin-boundaries', geojson, {
      lineColor: '#64748b',
      lineWidth: 1,
      lineOpacity: 0.5,
      fitBounds: true,
    });
  }
}
