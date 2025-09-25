/* eslint-disable @nx/enforce-module-boundaries */
import { ChangeDetectionStrategy, Component, computed, effect, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { ConfigurationService } from '@picsa/configuration/src';
import { IStationMeta } from '@picsa/models';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { IBasemapOptions, IMapMarker, IMapOptions, PicsaMapComponent } from '@picsa/shared/features/map/map';
import { _wait } from '@picsa/utils/browser.utils';
import { geoJSON, Map } from 'leaflet';
import { GEO_LOCATION_DATA, IGelocationData, topoJsonToGeoJson } from 'libs/data/geoLocation';

import { ClimateDataService } from '../../services/climate-data.service';

const STRINGS = { showMap: translateMarker('Show Map'), showList: translateMarker('Show List') };

@Component({
  selector: 'climate-site-select',
  templateUrl: './site-select.page.html',
  styleUrls: ['./site-select.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, PicsaMapComponent, PicsaDataTableComponent],
})
export class SiteSelectPage {
  selectedStation = signal<IStationMeta | undefined>(undefined, { equal: (a, b) => a?.id === b?.id });
  // avoid static: true for map as created dynamic
  picsaMap = viewChild<PicsaMapComponent>('picsaMap');

  mapReady = signal(false);

  // main options handled by featuredCountry
  mapOptions: IMapOptions = {};
  basemapOptions: IBasemapOptions = {
    src: 'assets/mapTiles/raw/{z}/{x}/{y}.webp',
    maxNativeZoom: 8,
  };

  view = signal<'list' | 'map'>('map');

  public strings = STRINGS;

  public mapMarkers = computed(() => {
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

  public tableData = computed(() => {
    const stations = this.dataService.stations();
    return stations.map((station, index) => {
      return { ...station, map: index + 1 };
    });
  });

  public tableOptions: IDataTableOptions = {
    displayColumns: ['map', 'name', 'district'],
    sort: { id: 'district', start: 'asc' },
  };

  private nearestStation = signal<IStationMeta | undefined>(undefined);

  private userCountryCode = computed(() => this.configurationService.userSettings().country_code);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dataService: ClimateDataService,
    private configurationService: ConfigurationService,
  ) {
    effect(async () => {
      const map = this.picsaMap()?.map();
      const country_code = this.userCountryCode();
      if (map && country_code) {
        await this.loadCountryAdminBoundaries(map, country_code);
      }
    });
    effect(async () => {
      const picsaMap = this.picsaMap();
      if (picsaMap && this.mapReady() && this.mapMarkers()?.length > 0) {
        await this.checkTmpPreferredStation();
        this.addUserLocationToMap(picsaMap);
      }
    });
    // auto select nearest station if no other selected
    effect(() => {
      const nearest = this.nearestStation();
      if (nearest && !this.selectedStation()) {
        this.selectedStation.set(nearest);
      }
    });
    // respond to selected station when map ready
    effect(() => {
      const selectedStation = this.selectedStation();
      const picsaMap = this.picsaMap();
      const mapReady = this.mapReady();
      if (selectedStation && picsaMap && mapReady) {
        this.handleStationSelected(selectedStation, picsaMap);
      }
    });
  }
  toggleView() {
    this.view.set(this.view() === 'list' ? 'map' : 'list');
  }

  goToSite(site: IStationMeta) {
    // navigate
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
      this.selectedStation.set(station);
    }
  }
  public handleMarkerClick(e: IMapMarker) {
    if (e) {
      this.selectedStation.set(e.data);
    }
  }

  private handleStationSelected(selectedStation: IStationMeta, picsaMap: PicsaMapComponent) {
    if (this.dataService.getPreferredStation() !== selectedStation.id) {
      this.dataService.setPreferredStation(selectedStation.id);
    }

    const marker = this.mapMarkers().find((m) => m.data?.id === selectedStation.id);
    if (marker) {
      picsaMap.setActiveMarker(marker);
    }
  }

  /**
   * The site-select page is bypassed if user has already defined a preferred station,
   * but a tmp station is set when navigating directly from the site view page to pick a new station
   */
  private async checkTmpPreferredStation() {
    // allow passing selected as state data for case when navigating back from climate chart page
    const tmpStation = localStorage.getItem('picsa_climate_station_temp');
    if (tmpStation) {
      localStorage.removeItem('picsa_climate_station_temp');
      const marker = this.mapMarkers().find((v) => v.data?.id === tmpStation);
      if (marker) {
        await _wait(500);
        this.selectedStation.set(marker.data);
      }
      return;
    }
  }

  /** Load country boundaries from geojson */
  private async loadCountryAdminBoundaries(map: Map, country_code: string) {
    const metadata: IGelocationData = GEO_LOCATION_DATA[country_code];
    if (!metadata) return;
    const topojson = await metadata.admin_4.topoJson();
    const feature = topoJsonToGeoJson(topojson);
    geoJSON(feature as any)
      .setStyle({ fill: false, color: 'brown', opacity: 0.5 })
      .addTo(map);
  }

  private addUserLocationToMap(picsaMap: PicsaMapComponent) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          picsaMap.setLocationMarker(userLat, userLng);
          this.calcClosestStation(userLat, userLng);
        },
        (error) => {
          console.error('Error getting user location', error);
        },
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }

  private calcClosestStation(userLat: number, userLng: number) {
    let minDistance = Number.MAX_VALUE;
    const nearest = this.mapMarkers().reduce((previous, current) => {
      const stationLat = current.latlng[0];
      const stationLng = current.latlng[1];
      const distance = this.calculateDistance(userLat, userLng, stationLat, stationLng);

      if (distance < minDistance) {
        minDistance = distance;
        return current;
      }
      return previous;
    });
    if (nearest) {
      this.nearestStation.set(nearest.data);
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const deltaX = lat2 - lat1;
    const deltaY = lng2 - lng1;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }
}
