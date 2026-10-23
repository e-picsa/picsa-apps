import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, viewChild } from '@angular/core';
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
  computeFeatureBbox,
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
export class SiteSelectPage {
  public readonly strings = STRINGS;

  public readonly dataService = inject(ClimateDataService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly configurationService = inject(ConfigurationService);
  private readonly dialog = inject(MatDialog);

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
    return this.sortedAllStations().map((station, index) => {
      const num = numberMap.get(station.id);
      const label = num ? `${num}. ${formatStationLabel(station.name)}` : formatStationLabel(station.name);
      return {
        latlng: [station.latitude, station.longitude] as [number, number],
        label,
        data: station,
        number: num,
        _index: index,
      };
    });
  });

  /** Table rows for the "All stations" dialog */
  public readonly tableData = computed(() => {
    const stations = this.sortedAllStations();
    return stations.map((station, index) => {
      const locationText = station.location?.join(', ') || '—';
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
    } as IDataTableOptions;
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

    // Effect: When selecting an initial parent location ahead of sublocation selection, zoom to its bounds
    let lastRenderedParentLocationId: string | undefined = undefined;
    effect(() => {
      const loc = this.selectedLocation();
      const parentId = loc?.[4];
      const hasSublocation = this.selectedLocationEntry() !== undefined;
      const countryCode = this.userCountryCode();
      const picsaMap = this.picsaMap();
      const mapReady = this.mapReady();

      if (!picsaMap || !mapReady || !countryCode || !parentId) {
        if (!parentId) lastRenderedParentLocationId = undefined;
        return;
      }

      // Only zoom to parent ahead of sublocation when sublocation is not yet selected
      if (hasSublocation) {
        lastRenderedParentLocationId = parentId;
        return;
      }

      if (lastRenderedParentLocationId === parentId) return;
      lastRenderedParentLocationId = parentId;

      getLocationCenterAndBoundary(countryCode as ICountryCode, parentId, 4).then((result) => {
        if (!result?.feature) return;
        if (this.selectedLocationEntry()) return;

        picsaMap.addGeoJsonLayer('selected-district-boundary', result.feature, {
          lineColor: '#16a34a',
          lineWidth: 2,
          lineOpacity: 0.6,
          fitBounds: false,
        });

        const bbox = computeFeatureBbox(result.feature);
        if (bbox) {
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          picsaMap.fitBounds(
            [
              [bbox.minLng, bbox.minLat],
              [bbox.maxLng, bbox.maxLat],
            ],
            {
              maxZoom: 7,
              padding: isMobile
                ? { top: 110, bottom: 145, left: 30, right: 30 }
                : { top: 40, bottom: 40, left: 40, right: 40 },
            },
          );
        }
      });
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
