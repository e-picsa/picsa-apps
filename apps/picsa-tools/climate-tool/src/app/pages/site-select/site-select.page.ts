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
    const markers: IMapMarker[] = stations.map((station, _index) => {
      return {
        latlng: [station.latitude, station.longitude],
        data: station,
        number: _index + 1,
        _index,
      };
    });
    this.mapMarkers = markers;
    return { stations, markers };
  }

  private getUserLocationAndSelectClosestStation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          this.selectClosestStation(userLat, userLng);
        },
        (error) => {
          console.error('Error getting user location', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }

  private selectClosestStation(userLat: number, userLng: number) {
    let minDistance = Number.MAX_VALUE;
    const nearest = this.mapMarkers.reduce((previous, current) => {
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
        this.picsaMap.setActiveMarker(nearest);
      });
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const deltaX = lat2 - lat1;
    const deltaY = lng2 - lng1;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }
}
