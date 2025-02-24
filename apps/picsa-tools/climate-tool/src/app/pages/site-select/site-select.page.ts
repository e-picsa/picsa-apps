import { Component, computed, effect, NgZone, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigurationService } from '@picsa/configuration/src';
import { IStationMeta } from '@picsa/models';
import { IBasemapOptions, IMapMarker, IMapOptions, PicsaMapComponent } from '@picsa/shared/features/map/map';
import { geoJSON, Map } from 'leaflet';
import { GEO_LOCATION_DATA, IGelocationData, topoJsonToGeoJson } from 'libs/data/geoLocation';

import { ClimateDataService } from '../../services/climate-data.service';

@Component({
  selector: 'climate-site-select',
  templateUrl: './site-select.page.html',
  styleUrls: ['./site-select.page.scss'],
  standalone: false,
})
export class SiteSelectPage {
  activeStation: any;
  // avoid static: true for map as created dynamic
  picsaMap = viewChild<PicsaMapComponent>('picsaMap');
  // main options handled by featuredCountry
  mapOptions: IMapOptions = {};
  basemapOptions: IBasemapOptions = {
    src: 'assets/mapTiles/raw/{z}/{x}/{y}.webp',
    maxNativeZoom: 8,
  };
  public mapMarkers = computed(() => {
    const stations = this.dataService.stations();
    const markers: IMapMarker[] = stations.map((station, _index) => ({
      latlng: [station.latitude, station.longitude],
      data: station,
      number: _index + 1,
      _index,
    }));
    return markers;
  });

  constructor(
    private ngZone: NgZone,
    private router: Router,
    private route: ActivatedRoute,
    private dataService: ClimateDataService,
    private configurationService: ConfigurationService
  ) {
    effect(async () => {
      const map = this.picsaMap()?.map();
      const { country_code } = this.configurationService.userSettings();
      if (map && country_code) {
        await this.loadCountryAdminBoundaries(map, country_code);
      }
    });
    effect(() => {
      const picsaMap = this.picsaMap();
      if (picsaMap) {
        this.getUserLocationAndSelectClosestStation(picsaMap);
      }
    });
  }

  onMarkerClick(marker: IMapMarker) {
    // linking to callback forces angular outside of usual cdr strategy/zone
    // so have to manually call ngZone.run to detect changes
    this.ngZone.run(() => {
      this.activeStation = { ...(marker.data as IStationMeta) };
    });
  }

  goToSite(site: IStationMeta) {
    // record current map bound positions for returning back
    const mapBounds = this.picsaMap()!.map().getBounds();
    localStorage.setItem('picsaSiteSelectBounds', JSON.stringify([mapBounds.getSouthWest(), mapBounds.getNorthEast()]));
    // navigate
    this.router.navigate(['./', 'site', site.id], {
      relativeTo: this.route,
      queryParams: {
        view: 'rainfall',
      },
    });
  }

  /** Load country boundaries from geojson */
  private async loadCountryAdminBoundaries(map: Map, country_code: string) {
    const metadata: IGelocationData = GEO_LOCATION_DATA[country_code];
    if (!metadata) return;
    const topojson = await metadata.admin_4.data();
    const feature = topoJsonToGeoJson(topojson);
    geoJSON(feature as any)
      .setStyle({ fill: false, color: 'brown', opacity: 0.5 })
      .addTo(map);
  }

  private getUserLocationAndSelectClosestStation(picsaMap: PicsaMapComponent) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          this.selectClosestStation(picsaMap, userLat, userLng);
          picsaMap.setLocationMarker(userLat, userLng);
        },
        (error) => {
          console.error('Error getting user location', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }

  private selectClosestStation(picsaMap: PicsaMapComponent, userLat: number, userLng: number) {
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
      this.ngZone.run(() => {
        this.activeStation = nearest.data;
        picsaMap.setActiveMarker(nearest);
      });
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const deltaX = lat2 - lat1;
    const deltaY = lng2 - lng1;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }
}
