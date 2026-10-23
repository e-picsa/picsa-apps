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
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { ConfigurationService } from '@picsa/configuration';
import type { ICountryCode } from '@picsa/data';
import { getDeepestLocations, getGeoLocationData, getLocationSlots, isLocationComplete } from '@picsa/data/geoLocation';
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
  getCombinedLocationAndStationBounds,
  getLocationCenterAndBoundary,
  getStationRecommendations,
  ILocationCenterResult,
  isStationInLocation,
  IStationRecommendation,
} from '../../utils/location-proximity.utils';
import { AllStationsDialogComponent } from './components/all-stations-dialog/all-stations-dialog.component';
import { StationCardComponent } from './components/station-card/station-card.component';

const STATION_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="6.191 0 87.619 100" fill="currentColor"><path d="M82.447,57.766c-3.112,0-5.937,1.255-7.992,3.29L55.353,47.369v-1.773c0-2.015-1.303-3.692-3.094-4.333V22.592c5.521-0.768,9.769-5.509,9.769-11.236C62.027,5.09,56.946,0,50.667,0c-6.266,0-11.348,5.091-11.348,11.355c0,5.727,4.247,10.468,9.77,11.236v18.688c-1.76,0.662-3.027,2.335-3.027,4.316v1.604L25.906,61.064c-2.071-2.262-5.049-3.678-8.355-3.678c-6.277,0-11.36,5.087-11.36,11.357c0,6.27,5.083,11.356,11.36,11.356c6.265,0,11.348-5.087,11.348-11.356c0-1.818-0.436-3.544-1.193-5.066l18.353-12.622v44.299c0,2.561,2.089,4.646,4.647,4.646c2.564,0,4.646-2.085,4.646-4.646V51.27l17.183,12.314c-0.91,1.632-1.437,3.524-1.437,5.529c0,6.283,5.087,11.357,11.351,11.357c6.273,0,11.36-5.074,11.36-11.357C93.808,62.844,88.721,57.766,82.447,57.766z"/></svg>`;

const STRINGS = {
  location: translateMarker('Location'),
  locate: translateMarker('Locate'),
  view: translateMarker('View'),
  allStations: translateMarker('All Stations'),
  climateStation: translateMarker('Climate Station'),
  stations: translateMarker('Stations'),
  findingStations: translateMarker('Finding closest stations'),
};

@Component({
  selector: 'picsa-site-select',
  imports: [
    CommonModule,
    FormLocationSelectComponent,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    PicsaMapComponent,
    PicsaTranslateModule,
    StationCardComponent,
  ],
  templateUrl: './site-select.page.html',
  styleUrl: './site-select.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteSelectPage implements AfterViewInit, OnDestroy {
  public readonly strings = STRINGS;

  public readonly dataService = inject(ClimateDataService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly configurationService = inject(ConfigurationService);
  private readonly dialog = inject(MatDialog);

  private readonly headerCenterPortal = viewChild<TemplateRef<unknown>>('headerCenterPortal');
  public readonly picsaMap = viewChild(PicsaMapComponent);

  /** User's assigned deployment country */
  public readonly userCountryCode = computed(() => this.configurationService.userSettings().country_code);

  /** Selected [country, admin_1, ..., admin_n] from form-location-select */
  public readonly selectedLocation = signal<(string | undefined)[]>([]);

  /** Map readiness flag bound from picsa-map */
  public readonly mapReady = signal(false);

  /** GPS location in progress */
  public readonly isLocating = signal(false);

  /** Deepest selected location entry when hierarchy selection is complete */
  public readonly selectedLocationEntry = computed(() => {
    const loc = this.selectedLocation();
    const country = this.userCountryCode();
    if (!country || !loc || !loc.length) return undefined;

    const geoData = getGeoLocationData(country as ICountryCode);
    if (!isLocationComplete(geoData, loc)) return undefined;

    const locationId = loc[5] ?? loc[4];
    if (!locationId) return undefined;

    return getDeepestLocations(geoData).find((l) => l.id === locationId);
  });

  /** Backwards-compatible alias for selectedLocationEntry */
  public readonly selectedDistrict = this.selectedLocationEntry;

  /** Selected station on map/table/card */
  public readonly selectedStation = signal<IStationMeta | undefined>(undefined);

  /** Ranked stations by proximity to selected location center */
  public readonly stationRecommendations = signal<IStationRecommendation[]>([]);

  /** Resolved center coordinates & feature boundary of the selected location */
  public readonly locationCenterResult = signal<ILocationCenterResult | undefined>(undefined);
  /** Backwards-compatible alias */
  public readonly districtCenterResult = this.locationCenterResult;

  public readonly isCalculatingProximity = signal(false);

  /** Bounding box combining the selected location feature and the recommended station */
  public readonly locationAndStationBounds = computed(() => {
    const result = this.locationCenterResult();
    const primary = this.primaryRecommendation();
    if (!result) return undefined;
    return getCombinedLocationAndStationBounds(result.feature, primary?.station, result.center);
  });
  /** Backwards-compatible alias */
  public readonly districtAndStationBounds = this.locationAndStationBounds;

  /** Primary recommendation (first in ranked list - closest station) */
  public readonly primaryRecommendation = computed(() => this.stationRecommendations()[0]);

  /** Nearby stations (including closest station first, top 4) */
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

  /** Active country stations (excluding draft/empty stations) sorted alphabetically by location, then by station name */
  public readonly sortedAllStations = computed(() => {
    const stations = this.dataService.stations().filter((s) => s.latitude !== null && s.longitude !== null);
    return [...stations].sort((a, b) => {
      const locA = a.location?.join(', ') || '';
      const locB = b.location?.join(', ') || '';
      const locCmp = locA.localeCompare(locB);
      if (locCmp !== 0) return locCmp;
      return a.name.localeCompare(b.name);
    });
  });

  /** Lookup of station ID to its 1-based map marker number */
  public readonly stationNumberMap = computed(() => {
    const map = new Map<string, number>();
    this.sortedAllStations().forEach((s, index) => map.set(s.id, index + 1));
    return map;
  });

  /** Recommendations mapped with their global station number */
  public readonly numberedRecommendations = computed(() => {
    const numberMap = this.stationNumberMap();
    return this.stationRecommendations().map((rec) => ({
      ...rec,
      stationNumber: numberMap.get(rec.station.id),
    }));
  });

  /** Displayed recommendation for the mobile station card */
  public readonly displayedStation = computed(() => {
    const selected = this.selectedStation();
    const numbered = this.numberedRecommendations();
    if (selected) {
      const match = numbered.find((r) => r.station.id === selected.id);
      if (match) return match;
      return {
        station: selected,
        distanceKm: 0,
        isInsideLocation: false,
        isInsideDistrict: false,
        isRecommended: false,
        score: 0,
        stationNumber: this.stationNumberMap().get(selected.id),
      };
    }
    return numbered[0];
  });

  /** Active station for floating mobile card */
  public readonly activeStation = computed(() => this.displayedStation()?.station);

  /** Map markers for all valid stations in the country */
  public readonly mapMarkers = computed<IMapMarker[]>(() => {
    const numberMap = this.stationNumberMap();
    return this.sortedAllStations().map((station) => {
      const num = numberMap.get(station.id);
      const label = num ? `${num}. ${formatStationLabel(station.name)}` : formatStationLabel(station.name);
      return {
        lat: station.latitude,
        lng: station.longitude,
        title: label,
        data: station,
        icon: STATION_ICON_SVG,
        badgeNumber: num,
      };
    });
  });

  /** Table rows for the "All stations" dialog */
  public readonly tableData = computed(() => {
    const stations = this.sortedAllStations();
    return stations.map((station, index) => {
      const locationText = station.location?.join(', ') || '\u2014';
      return {
        ...station,
        name: formatStationLabel(station.name),
        district: locationText,
        number: this.stationNumberMap().get(station.id) ?? index + 1,
      };
    });
  });

  /** Table configuration for the "All stations" dialog */
  public readonly tableOptions = computed(() => {
    const country_code = this.userCountryCode();
    const geoData = getGeoLocationData(country_code);
    const slots = getLocationSlots(geoData);
    const deepestLabel = geoData[slots[slots.length - 1]]?.label ?? geoData.admin_4.label;
    return {
      displayColumns: ['map', 'name', 'district'],
      formatHeader: (v) => {
        if (v === 'district') return deepestLabel;
        return formatHeaderDefault(v);
      },
      sort: { id: 'district', start: 'asc' },
    } as IDataTableOptions<IStationMeta>;
  });

  /** Tracks station selections triggered by user clicks vs automatic recommendations */
  private manualStationSelection: IStationMeta | undefined = undefined;

  constructor() {
    const settings = this.configurationService.userSettings();
    const initialLocation = settings?.location;
    if (initialLocation && initialLocation.length > 0) {
      this.selectedLocation.set(initialLocation);
    }

    // Effect: Whenever selected location entry changes, asynchronously compute recommendations & boundary
    let latestLocationReqId = 0;
    effect(() => {
      const locationEntry = this.selectedLocationEntry();
      const countryCode = this.userCountryCode();
      const activeStations = this.dataService.stations();
      const picsaMap = this.picsaMap();
      const mapReady = this.mapReady();

      if (!locationEntry || !countryCode) {
        this.stationRecommendations.set([]);
        this.locationCenterResult.set(undefined);
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

      const reqId = ++latestLocationReqId;
      this.isCalculatingProximity.set(true);
      this.locationCenterResult.set(undefined);
      if (!preservedStation) {
        this.selectedStation.set(undefined);
        if (picsaMap && mapReady) {
          picsaMap.clearActiveMarker();
          picsaMap.removeGeoJsonLayer('selected-district-boundary');
        }
      }

      getLocationCenterAndBoundary(countryCode as ICountryCode, locationEntry.id)
        .then((result) => {
          if (reqId !== latestLocationReqId) return;
          this.locationCenterResult.set(result);
          this.isCalculatingProximity.set(false);

          if (result) {
            const recommendations = getStationRecommendations(
              activeStations,
              result.center,
              locationEntry.label,
              locationEntry.id,
            );
            this.stationRecommendations.set(recommendations);

            if (recommendations.length > 0) {
              const targetStation = preservedStation ?? recommendations[0].station;
              this.selectedStation.set(targetStation);
              const picsaMapInstance = this.picsaMap();
              if (picsaMapInstance && this.mapReady()) {
                const marker = this.mapMarkers().find((m) => m.data?.id === targetStation.id);
                if (marker) {
                  picsaMapInstance.setActiveMarker(marker, false, true);
                }
              }
            }
          }
        })
        .catch((err) => {
          if (reqId === latestLocationReqId) {
            console.error('[SiteSelectPage] Error calculating proximity:', err);
            this.isCalculatingProximity.set(false);
          }
        });
    });

    // Effect: Update MapGeoJsonLayer and camera when location and primary recommendation resolve
    let lastRenderedForMapLocationId: string | undefined = undefined;
    effect(() => {
      const locationEntry = this.selectedLocationEntry();
      const result = this.locationCenterResult();
      const picsaMap = this.picsaMap();
      const mapReady = this.mapReady();
      const activeStation = this.displayedStation()?.station;

      if (!picsaMap || !mapReady || !locationEntry || !result) {
        if (!locationEntry) lastRenderedForMapLocationId = undefined;
        return;
      }
      if (lastRenderedForMapLocationId === locationEntry.id) return;
      lastRenderedForMapLocationId = locationEntry.id;

      if (result.feature) {
        picsaMap.addGeoJsonLayer('selected-district-boundary', result.feature, {
          lineColor: '#16a34a',
          lineWidth: 3,
          lineOpacity: 0.9,
          fitBounds: false,
        });
      }

      const bounds = this.locationAndStationBounds();
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
          picsaMap.setActiveMarker(marker, false, true);
        }
      }
    });
  }

  public ngAfterViewInit() {
    this.registerHeaderPortal();
    // Default to map view on initial load
    this.setView('map');
  }

  public ngOnDestroy() {
    // Clean up header portal on navigate away
    this.configurationService.setPortalContent?.({
      headerCenterPortal: null,
      headerEndPortal: null,
    });
  }

  public setView(view: 'map' | 'table') {
    if (view === 'table') {
      this.openAllStationsDialog();
    }
  }

  public handleLocationChanged(location: (string | undefined)[]) {
    if (isEqual(location, this.selectedLocation())) {
      return;
    }
    this.selectedLocation.set(location);
    const country = this.userCountryCode();
    if (country) {
      const geoData = getGeoLocationData(country as ICountryCode);
      if (isLocationComplete(geoData, location)) {
        this.configurationService.updateUserSettings({ location });
      }
    }
  }

  private registerHeaderPortal() {
    const centerPortal = this.headerCenterPortal();
    if (centerPortal) {
      this.configurationService.setPortalContent?.({
        headerCenterPortal: centerPortal,
      });
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
        this.syncLocationFromStation(station);
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
      this.syncLocationFromStation(e.data);
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

    let closestStation = activeStations[0];
    let minDistance = calculateHaversineDistanceKm(userLat, userLng, closestStation.latitude, closestStation.longitude);

    for (let i = 1; i < activeStations.length; i++) {
      const s = activeStations[i];
      const dist = calculateHaversineDistanceKm(userLat, userLng, s.latitude, s.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        closestStation = s;
      }
    }

    this.selectedStation.set(closestStation);
    this.syncLocationFromStation(closestStation);

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
   * When a user clicks a station directly on the map or table, populate the location
   * selector if the station maps to a known location and no location (or a different location) is selected.
   */
  public syncLocationFromStation(station: IStationMeta) {
    const country = this.userCountryCode();
    if (!country || !station.location?.length) return;

    const geoData = getGeoLocationData(country as ICountryCode);
    const deepest = getDeepestLocations(geoData);
    const matchingLocation = deepest.find((d) => isStationInLocation(station, d.label, d.id));
    if (!matchingLocation || matchingLocation.id === this.selectedLocationEntry()?.id) {
      return;
    }

    this.manualStationSelection = station;
    const location: (string | undefined)[] = matchingLocation.parentId
      ? [undefined, undefined, country, undefined, matchingLocation.parentId, matchingLocation.id]
      : [undefined, undefined, country, undefined, matchingLocation.id];

    this.selectedLocation.set(location);
    this.configurationService.updateUserSettings({ location });
  }

  public syncDistrictFromStation(station: IStationMeta) {
    this.syncLocationFromStation(station);
  }
}
