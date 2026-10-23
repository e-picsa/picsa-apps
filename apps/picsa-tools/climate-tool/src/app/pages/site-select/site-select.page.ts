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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaCommonComponentsService } from '@picsa/components';
import { ConfigurationService } from '@picsa/configuration';
import type { ICountryCode } from '@picsa/data';
import { getDeepestLocations, getGeoLocationData } from '@picsa/data/geoLocation';
import { FormLocationSelectComponent } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { IStationMeta } from '@picsa/models';
import { formatHeaderDefault, IDataTableOptions } from '@picsa/shared/features/data-table/data-table.component';
import { IMapMarker, PicsaMapComponent } from '@picsa/shared/features/map/map';
import { isEqual } from '@picsa/utils/object.utils';

import { ClimateDataService } from '../../services/climate-data.service';
import {
  calculateHaversineDistanceKm,
  formatStationLabel,
  getCombinedDistrictAndStationBounds,
  getDistrictCenterAndBoundary,
  getStationRecommendations,
  IDistrictCenterResult,
  isStationInDistrict,
  IStationRecommendation,
} from '../../utils/location-proximity.utils';
import { AllStationsDialogComponent } from './components/all-stations-dialog/all-stations-dialog.component';
import { StationCardComponent } from './components/station-card/station-card.component';

const STATION_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="6.191 0 87.619 100" fill="currentColor"><path d="M82.447,57.766c-3.112,0-5.937,1.255-7.992,3.29L55.353,47.369v-1.773c0-2.015-1.303-3.692-3.094-4.333V22.592c5.521-0.768,9.769-5.509,9.769-11.236C62.027,5.09,56.946,0,50.667,0c-6.266,0-11.348,5.091-11.348,11.355c0,5.727,4.247,10.468,9.77,11.236v18.688c-1.76,0.662-3.027,2.335-3.027,4.316v1.604L25.906,61.064c-2.071-2.262-5.049-3.678-8.355-3.678c-6.277,0-11.36,5.087-11.36,11.357c0,6.27,5.083,11.356,11.36,11.356c6.265,0,11.348-5.087,11.348-11.356c0-1.818-0.436-3.544-1.193-5.066l18.353-12.622v44.299c0,2.561,2.089,4.646,4.647,4.646c2.564,0,4.646-2.085,4.646-4.646V51.27l17.183,12.314c-0.91,1.632-1.437,3.524-1.437,5.529c0,6.283,5.087,11.357,11.351,11.357c6.273,0,11.36-5.074,11.36-11.357C93.808,62.844,88.721,57.766,82.447,57.766z"/></svg>`;

const STRINGS = {
  map: translateMarker('Map'),
  list: translateMarker('List'),
  location: translateMarker('Location'),
  locate: translateMarker('Locate'),
  view: translateMarker('View'),
  allStations: translateMarker('All Stations'),
  climateStation: translateMarker('Climate Station'),
  stations: translateMarker('Stations'),
  findingStations: translateMarker('Finding closest stations'),
};

// eslint-disable-next-line @angular-eslint/component-class-suffix
@Component({
  selector: 'climate-site-select',
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTooltipModule,
    PicsaTranslateModule,
    FormLocationSelectComponent,
    PicsaMapComponent,
    StationCardComponent,
  ],
  templateUrl: './site-select.page.html',
  styleUrls: ['./site-select.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class SiteSelectPage implements AfterViewInit, OnDestroy {
  public readonly strings = STRINGS;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public readonly dataService = inject(ClimateDataService);
  private configurationService = inject(ConfigurationService);
  private componentsService = inject(PicsaCommonComponentsService);
  private viewContainer = inject(ViewContainerRef);
  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);
  private dialog = inject(MatDialog);

  /** Tracks a station directly clicked on the map/table so district sync does not overwrite it */
  private manualStationSelection: IStationMeta | undefined = undefined;

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

  /** GPS location in progress */
  public readonly isLocating = signal(false);

  /** Deepest selected location entry (district) */
  public readonly selectedDistrict = computed(() => {
    const loc = this.selectedLocation();
    const country = this.userCountryCode();
    if (!country || !loc || !loc.length) return undefined;

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

  /** Bounding box combining the selected district feature and the recommended station */
  public readonly districtAndStationBounds = computed(() => {
    const result = this.districtCenterResult();
    const primary = this.primaryRecommendation();
    if (!result) return undefined;
    return getCombinedDistrictAndStationBounds(result.feature, primary?.station, result.center);
  });

  /** Primary recommendation (first in ranked list - closest station) */
  public readonly primaryRecommendation = computed(() => this.stationRecommendations()[0]);

  /** Active country stations (excluding draft/empty stations) sorted alphabetically by district, then by station name */
  public readonly sortedAllStations = computed(() => {
    const stations = this.dataService.stations().filter((s) => s.latitude !== null && s.longitude !== null);
    return [...stations].sort((a, b) => {
      const distA = a.location?.[0] || '';
      const distB = b.location?.[0] || '';
      const distCmp = distA.localeCompare(distB);
      if (distCmp !== 0) return distCmp;
      return a.name.localeCompare(b.name);
    });
  });

  /** Lookup of station ID to its 1-based map marker number */
  public readonly stationNumberMap = computed(() => {
    const map = new Map<string, number>();
    this.sortedAllStations().forEach((s, index) => map.set(s.id, index + 1));
    return map;
  });

  /** Nearby stations (including closest station first, top 4) with map station number */
  public readonly nearbyStations = computed(() => {
    const numberMap = this.stationNumberMap();
    return this.stationRecommendations()
      .slice(0, 4)
      .map((rec) => ({
        ...rec,
        mapNumber: numberMap.get(rec.station.id),
        station: { ...rec.station, name: formatStationLabel(rec.station.name) },
      }));
  });

  /** Alias for backward compatibility */
  public readonly alternativeRecommendations = this.nearbyStations;

  /** Currently displayed station (either explicitly selected or primary recommendation) */
  public readonly displayedStation = computed(() => {
    const selected = this.selectedStation();
    const primary = this.primaryRecommendation();
    const targetStation = selected ?? primary?.station;
    if (!targetStation) return undefined;

    const numberMap = this.stationNumberMap();

    return {
      station: { ...targetStation, name: formatStationLabel(targetStation.name) },
      isPrimary: targetStation.id === primary?.station.id,
      mapNumber: numberMap.get(targetStation.id),
    };
  });

  /** Active station for floating mobile card */
  public readonly activeStation = computed(() => this.displayedStation()?.station);

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
    this.matIconRegistry.addSvgIconLiteral(
      'climate_station',
      this.domSanitizer.bypassSecurityTrustHtml(STATION_ICON_SVG),
    );

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
      const activeStations = this.dataService.stations();
      const picsaMap = this.picsaMap();
      const mapReady = this.mapReady();

      if (!district || !countryCode) {
        this.stationRecommendations.set([]);
        this.districtCenterResult.set(undefined);
        this.isCalculatingProximity.set(false);
        if (!this.manualStationSelection) {
          this.selectedStation.set(undefined);
        }
        if (picsaMap && mapReady && !this.manualStationSelection) {
          picsaMap.clearActiveMarker();
          picsaMap.removeGeoJsonLayer('selected-district-boundary');
        }
        return;
      }

      const preservedStation = this.manualStationSelection;
      this.manualStationSelection = undefined;

      const reqId = ++latestDistrictReqId;
      this.isCalculatingProximity.set(true);
      this.districtCenterResult.set(undefined);
      if (!preservedStation) {
        this.selectedStation.set(undefined);
        if (picsaMap && mapReady) {
          picsaMap.clearActiveMarker();
          picsaMap.removeGeoJsonLayer('selected-district-boundary');
        }
      }

      getDistrictCenterAndBoundary(countryCode as ICountryCode, district.id)
        .then((result) => {
          if (reqId !== latestDistrictReqId) return;
          this.districtCenterResult.set(result);
          this.isCalculatingProximity.set(false);

          if (result) {
            const recommendations = getStationRecommendations(
              activeStations,
              result.center,
              district.label,
              district.id,
            );
            this.stationRecommendations.set(recommendations);

            if (recommendations.length > 0) {
              const targetStation = preservedStation ?? recommendations[0].station;
              this.selectedStation.set(targetStation);
              const picsaMapInstance = this.picsaMap();
              if (picsaMapInstance && this.mapReady()) {
                const marker = this.mapMarkers().find((m) => m.data?.id === targetStation.id);
                if (marker) {
                  picsaMapInstance.setActiveMarker(marker, false, !preservedStation);
                }
              }
            }
          } else {
            this.stationRecommendations.set([]);
          }
        })
        .catch((err) => {
          if (reqId !== latestDistrictReqId) return;
          console.error('[SiteSelectPage] Failed to calculate proximity:', err);
          this.isCalculatingProximity.set(false);
          this.stationRecommendations.set([]);
        });
    });

    // Effect: Update MapGeoJsonLayer and camera when district and primary recommendation resolve
    let lastRenderedForMapDistrictId: string | undefined = undefined;
    effect(() => {
      const district = this.selectedDistrict();
      const result = this.districtCenterResult();
      const picsaMap = this.picsaMap();
      const mapReady = this.mapReady();
      const activeStation = this.displayedStation()?.station;

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
            ? { top: 110, bottom: 145, left: 30, right: 30 }
            : { top: 40, bottom: 40, left: 40, right: 40 },
        });
      }

      if (activeStation) {
        const marker = this.mapMarkers().find((m) => m.data?.id === activeStation.id);
        if (marker) {
          picsaMap.setActiveMarker(marker, false, false);
        }
      }
    });

    // Effect: Automated location attempt when map is ready and no location is set
    let hasAttemptedInitialLocate = false;
    effect(() => {
      const mapReady = this.mapReady();
      const location = this.selectedLocation();
      const selectedStation = this.selectedStation();

      if (mapReady && (!location || location.length === 0) && !selectedStation && !hasAttemptedInitialLocate) {
        hasAttemptedInitialLocate = true;
        this.locateUser(true);
      }
    });
  }

  ngAfterViewInit() {
    const portal = this.headerEndPortal();
    if (portal) {
      this.componentsService.patchHeader?.({
        cdkPortalEnd: new TemplatePortal(portal, this.viewContainer),
      });
    }
  }

  ngOnDestroy() {
    this.componentsService.patchHeader?.({
      cdkPortalEnd: undefined,
    });
  }

  public toggleView() {
    this.view.update((v) => (v === 'map' ? 'recommendation' : 'map'));
  }

  public handleLocationChanged(location: (string | undefined)[]) {
    if (isEqual(location, this.selectedLocation())) {
      return;
    }
    this.manualStationSelection = undefined;
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
    const station = this.dataService.stations().find((s) => s.id === row.id);
    if (station) {
      if (station.id === this.selectedStation()?.id) {
        this.confirmAndNavigate(station);
      } else {
        this.selectedStation.set(station);
        this.syncDistrictFromStation(station);
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
      this.syncDistrictFromStation(e.data);
    }
  }

  public selectStation(stationName: string) {
    if (stationName) {
      this.selectedStation.set({ name: stationName } as IStationMeta);
    }
  }

  /**
   * Request browser geolocation, place location pin, and recommend closest stations
   */
  public locateUser(silent = false) {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (!silent) console.warn('[SiteSelectPage] Geolocation not supported');
      return;
    }
    this.isLocating.set(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.isLocating.set(false);
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const picsaMap = this.picsaMap();
        if (picsaMap && this.mapReady()) {
          picsaMap.setLocationMarker(userLat, userLng);
        }
        this.recommendStationsFromCoordinates(userLat, userLng);
      },
      (err) => {
        this.isLocating.set(false);
        if (!silent) {
          console.warn('[SiteSelectPage] Geolocation error:', err);
        }
      },
      { timeout: 10000, enableHighAccuracy: false },
    );
  }

  /**
   * Given user coordinates, find closest station and sync location
   */
  private recommendStationsFromCoordinates(userLat: number, userLng: number) {
    const activeStations = this.dataService
      .stations()
      .filter((s) => s.latitude !== null && s.longitude !== null && !s.draft);
    if (activeStations.length === 0) return;

    let closestStation: IStationMeta = activeStations[0];
    let minDistance = Infinity;

    for (const station of activeStations) {
      const distance = calculateHaversineDistanceKm(userLat, userLng, station.latitude, station.longitude);
      if (distance < minDistance) {
        minDistance = distance;
        closestStation = station;
      }
    }

    this.selectedStation.set(closestStation);
    this.syncDistrictFromStation(closestStation);

    const picsaMap = this.picsaMap();
    if (picsaMap && this.mapReady()) {
      const marker = this.mapMarkers().find((m) => m.data?.id === closestStation.id);
      if (marker) {
        picsaMap.setActiveMarker(marker, false, true);
      }
    }
  }

  /**
   * Open dialog showing all stations in a table
   */
  public openAllStationsDialog() {
    const dialogRef = this.dialog.open(AllStationsDialogComponent, {
      data: {
        data: this.tableData(),
        options: this.tableOptions(),
      },
      panelClass: 'no-padding',
      autoFocus: false,
      width: '95vw',
      maxWidth: '650px',
      maxHeight: '85vh',
    });

    dialogRef.afterClosed().subscribe((station?: IStationMeta) => {
      if (station) {
        this.handleRowClick(station);
      }
    });
  }

  /**
   * When a user clicks a station directly on the map or table, populate the district
   * selector if the station maps to a known district and no district (or a different district) is selected.
   */
  private syncDistrictFromStation(station: IStationMeta) {
    const country = this.userCountryCode();
    if (!country || !station.location?.length) return;

    const geoData = getGeoLocationData(country as ICountryCode);
    const deepest = getDeepestLocations(geoData);
    const matchingDistrict = deepest.find((d) => isStationInDistrict(station, d.label, d.id));
    if (!matchingDistrict || matchingDistrict.id === this.selectedDistrict()?.id) {
      return;
    }

    this.manualStationSelection = station;
    const location: (string | undefined)[] = matchingDistrict.parentId
      ? [undefined, undefined, country, undefined, matchingDistrict.parentId, matchingDistrict.id]
      : [undefined, undefined, country, undefined, matchingDistrict.id];

    this.selectedLocation.set(location);
    this.configurationService.updateUserSettings({ location });
  }
}
