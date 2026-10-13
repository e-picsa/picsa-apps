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
  getDistrictCenterAndBoundary,
  getStationRecommendations,
  IDistrictCenterResult,
  IStationRecommendation,
} from '../../utils/location-proximity.utils';

const STRINGS = {
  showMap: translateMarker('Show Map'),
  showLocation: translateMarker('Show Location'),
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
    PicsaMapComponent,
    PicsaDataTableComponent,
    FormLocationSelectComponent,
    PicsaTranslateModule,
  ],
})
export class SiteSelectPage {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dataService = inject(ClimateDataService);
  private configurationService = inject(ConfigurationService);

  public readonly strings = STRINGS;

  // Selected station & state
  public readonly selectedStation = signal<IStationMeta | undefined>(undefined, {
    equal: (a, b) => a?.id === b?.id,
  });

  // Current selected location array [country, admin4, admin5/6]
  public readonly selectedLocation = signal<(string | undefined)[]>([]);

  // Proximity & recommendation state
  public readonly isCalculatingProximity = signal(false);
  public readonly districtCenterResult = signal<IDistrictCenterResult | undefined>(undefined);
  public readonly stationRecommendations = signal<IStationRecommendation[]>([]);

  public readonly primaryRecommendation = computed(() => this.stationRecommendations()[0]);
  public readonly alternativeRecommendations = computed(() => this.stationRecommendations().slice(1, 4));

  // View state
  public readonly showAllStations = signal(false);
  public readonly view = signal<'recommendation' | 'map'>('recommendation');
  public readonly mapReady = signal(false);

  // Map reference
  public readonly picsaMap = viewChild<PicsaMapComponent>('picsaMap');

  public readonly userCountryCode = computed(() => this.configurationService.userSettings().country_code);

  /**
   * Resolved deepest district label and id from currently selected location array
   */
  public readonly selectedDistrict = computed(() => {
    const country = this.userCountryCode();
    const loc = this.selectedLocation();
    if (!country || !loc || loc.length === 0) return undefined;

    // In multi-tier countries (ZM: slot 5, ZW: slot 5/6), take the deepest selected slot
    const districtId = loc[5] ?? loc[4];
    if (!districtId) return undefined;

    const geoData = getGeoLocationData(country as ICountryCode);
    const deepest = getDeepestLocations(geoData);
    const match = deepest.find((d) => d.id === districtId);
    return match ? { id: districtId, label: match.label } : { id: districtId, label: districtId };
  });

  public readonly mapMarkers = computed(() => {
    const stations = this.dataService.stations();
    const markers: IMapMarker[] = stations
      .filter((s) => s.latitude !== null && s.longitude !== null)
      .map((station, _index) => ({
        latlng: [station.latitude, station.longitude],
        data: station,
        number: _index + 1,
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
    effect(async () => {
      const picsaMap = this.picsaMap();
      const country_code = this.userCountryCode();
      if (picsaMap && picsaMap.mapReady() && country_code) {
        await this.loadCountryAdminBoundaries(picsaMap, country_code);
      }
    });

    // Effect: Check for temporary preferred station when returning from chart view
    effect(async () => {
      const picsaMap = this.picsaMap();
      if (picsaMap && this.mapReady() && this.mapMarkers()?.length > 0) {
        await this.checkTmpPreferredStation();
      }
    });

    // Effect: Calculate district centroid and station proximity whenever selectedDistrict changes
    effect(async () => {
      const district = this.selectedDistrict();
      const countryCode = this.userCountryCode();
      const allStations = this.dataService.stations();

      if (!district || !countryCode) {
        this.stationRecommendations.set([]);
        this.districtCenterResult.set(undefined);
        return;
      }

      this.isCalculatingProximity.set(true);
      try {
        const result = await getDistrictCenterAndBoundary(countryCode as ICountryCode, district.id);
        this.districtCenterResult.set(result);

        if (result?.center) {
          const recommendations = getStationRecommendations(allStations, result.center, district.label, district.id);
          this.stationRecommendations.set(recommendations);

          // Default selected station to the primary recommended station if not already chosen
          const currentSelected = untracked(() => this.selectedStation());
          if (!currentSelected || !recommendations.some((r) => r.station.id === currentSelected.id)) {
            this.selectedStation.set(recommendations[0]?.station);
          }
        }

        // Highlight district boundary on map if feature is present
        const picsaMap = this.picsaMap();
        if (picsaMap && this.mapReady() && result?.feature) {
          picsaMap.addGeoJsonLayer('selected-district-boundary', result.feature, {
            lineColor: '#16a34a',
            lineWidth: 3,
            lineOpacity: 0.9,
            fitBounds: true,
            padding: 40,
          });
        }
      } finally {
        this.isCalculatingProximity.set(false);
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
    try {
      const metadata = getGeoLocationData(country_code as ICountryCode);
      const topojson = await metadata.topoJson();
      const feature = topoJsonToGeoJson(topojson, 4);
      picsaMap.addGeoJsonLayer('country-boundaries', feature, {
        lineColor: '#94a3b8',
        lineOpacity: 0.4,
        lineWidth: 1.5,
      });
    } catch (err) {
      console.warn('[SiteSelectPage] Could not load country admin boundaries:', err);
    }
  }
}
