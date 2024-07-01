import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigurationService } from '@picsa/configuration';
import { IStationMeta, IStationMetaDB } from '@picsa/models';
import { IBasemapOptions, IMapMarker, IMapOptions, PicsaMapComponent } from '@picsa/shared/features/map/map';

import { HARDCODED_STATIONS } from '../../data';

@Component({
  selector: 'climate-site-select',
  templateUrl: './site-select.page.html',
  styleUrls: ['./site-select.page.scss'],
})
export class SiteSelectPage implements OnInit {
  activeStation: any;
  // avoid static: true for map as created dynamic
  @ViewChild('picsaMap') picsaMap: PicsaMapComponent;
  // main options handled by featuredCountry
  mapOptions: IMapOptions = {};
  basemapOptions: IBasemapOptions = {
    src: 'assets/mapTiles/raw/{z}/{x}/{y}.webp',
    maxNativeZoom: 8,
  };
  mapMarkers: IMapMarker[] = [];

  shortestDistanceMark:IMapMarker;

  constructor(
    private ngZone: NgZone,
    private router: Router,
    private route: ActivatedRoute,
    private configurationService: ConfigurationService
  ) {}

  ngOnInit() {
    this.populateSites();
    this.getUserLocationAndSelectClosestStation();
  }

  onMarkerClick(marker: IMapMarker) {
    // linking to callback forces angular outside of usual cdr strategy/zone
    // so have to manually call ngZone.run to detect changes
    this.ngZone.run(() => {
      this.activeStation = { ...(marker.data as IStationMeta) };
    });
  }

  goToSite(site: IStationMetaDB) {
    // record current map bound positions for returning back
    const mapBounds = this.picsaMap.map.getBounds();
    localStorage.setItem('picsaSiteSelectBounds', JSON.stringify([mapBounds.getSouthWest(), mapBounds.getNorthEast()]));
    // navigate
    this.router.navigate(['./', 'site', site._key], {
      relativeTo: this.route,
      queryParams: {
        view: 'rainfall',
      },
    });
  }

  populateSites() {
    let stations = HARDCODED_STATIONS;
    const { climateTool, country_code } = this.configurationService.deploymentSettings();
    const filterFn = climateTool?.station_filter;
    if (filterFn) {
      stations = stations.filter((station) => filterFn(station));
    } else {
      stations = stations.filter((station) => station.countryCode === country_code);
    }
    const markers: IMapMarker[] = stations.map((s, i) => {
      return {
        latlng: [s.latitude, s.longitude],
        data: s,
        number: i + 1,
      };
    });
    this.mapMarkers = markers;
    return { stations, markers };
  }

  getUserLocationAndSelectClosestStation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          this.selectClosestStation(userLat, userLng);
        },
        (error) => {
          console.error('Error getting user location', error);
          // Fallback if location is not available
          this.selectFallbackStation();
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      // Fallback if geolocation is not supported
      this.selectFallbackStation();
    }
  }

  selectClosestStation(userLat: number, userLng: number) {
    let closestStation;
    let minDistance = Number.MAX_VALUE;

    this.mapMarkers.forEach(marker => {
      const stationLat = marker.latlng[0];
      const stationLng = marker.latlng[1];
      const distance = this.calculateDistance(userLat, userLng, stationLat, stationLng);

      if (distance < minDistance) {
        minDistance = distance;
        closestStation = marker;
      }
    });
     if (closestStation) {
    this.ngZone.run(() => {
      this.activeStation = closestStation.data;
      this.shortestDistanceMark = closestStation;
    });
  }
  }

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const deltaX = lat2 - lat1;
    const deltaY = lng2 - lng1;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  selectFallbackStation() {
    if (this.mapMarkers.length > 0) {
      this.activeStation = this.mapMarkers[0].data;
    }
  }
}
