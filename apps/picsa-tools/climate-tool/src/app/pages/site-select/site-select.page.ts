import { Component, NgZone,ViewChild } from '@angular/core';
import { ActivatedRoute,Router } from '@angular/router';
import { ConfigurationService } from '@picsa/configuration';
import { IStationMeta } from '@picsa/models';
import {
  IBasemapOptions,
  IMapMarker,
  IMapOptions,
  PicsaMapComponent,
} from '@picsa/shared/features/map/map';

import { HARDCODED_STATIONS } from '../../data';

@Component({
  selector: 'climate-site-select',
  templateUrl: './site-select.page.html',
  styleUrls: ['./site-select.page.scss'],
})
export class SiteSelectPage {
  activeStation: any;
  // avoid static: true for map as created dynamic
  @ViewChild('picsaMap') picsaMap: PicsaMapComponent;
  // main options handled by featuredCountry
  mapOptions: IMapOptions = {};
  basemapOptions: IBasemapOptions = {
    src: 'assets/mapTiles/raw/{z}/{x}/{y}.webp',
    maxNativeZoom: 8,
  };

  constructor(
    private ngZone: NgZone,
    private router: Router,
    private route: ActivatedRoute,
    private configurationService: ConfigurationService
  ) {}

  // called from html when onMapReady is triggered
  onMapReady(map: PicsaMapComponent['map']) {
    // sometimes map ready fires before angular change detection complete and viewchild picked up
    if (!this.picsaMap) {
      return setTimeout(() => {
        this.onMapReady(map);
      }, 50);
    }
    return this.ngZone.run(() => {
      this.setMapBounds();
    });
  }
  private setMapBounds() {
    const { stations } = this.populateSites();
    // use stored last bounds if exist (ephemeral only)
    const lastMapBounds = localStorage.getItem('picsaSiteSelectBounds');
    if (lastMapBounds) {
      localStorage.removeItem('picsaSiteSelectBounds');
      this.picsaMap.map.fitBounds(JSON.parse(lastMapBounds));
    } else {
      // otherwise try to fit a bounding box with all stations
      this.picsaMap.fitMapToPoints(
        stations.map((s) => [s.latitude, s.longitude])
      );
    }
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
    const mapBounds = this.picsaMap.map.getBounds();
    localStorage.setItem(
      'picsaSiteSelectBounds',
      JSON.stringify([mapBounds.getSouthWest(), mapBounds.getNorthEast()])
    );
    // navigate
    this.router.navigate(['./', 'site', site._key], {
      relativeTo: this.route,
      queryParams: {
        view: 'rainfall',
      },
    });
  }

  populateSites() {
    const iconUrl = STATION_ICON_WHITE;
    let stations = HARDCODED_STATIONS;
    const { climateTool, localisation } =
      this.configurationService.activeConfiguration;
    const filterFn = climateTool?.stationFilter;
    if (filterFn) {
      stations = stations.filter((station) => filterFn(station));
    } else {
      stations = stations.filter(
        (station) => station.countryCode === localisation.country.code
      );
    }
    const markers: IMapMarker[] = stations.map((s) => {
      return {
        iconUrl,
        latlng: [s.latitude, s.longitude],
        data: s,
        numbered: true,
      };
    });
    this.picsaMap.addMarkers(markers);
    return { stations, markers };
  }
}

// svg icon hardcoded to data uri
const STATION_ICON_BLACK =
  "data:image/svg+xml,%3Csvg width='100px' height='100px' enable-background='new 6.191 0 87.619 100' fill='%23000000' version='1.1' viewBox='6.191 0 87.619 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m82.447 57.766c-3.112 0-5.937 1.255-7.992 3.29l-19.102-13.687v-1.773c0-2.015-1.303-3.692-3.094-4.333v-18.671c5.521-0.768 9.769-5.509 9.769-11.236-1e-3 -6.266-5.082-11.356-11.361-11.356-6.266 0-11.348 5.091-11.348 11.355 0 5.727 4.247 10.468 9.77 11.236v18.688c-1.76 0.662-3.027 2.335-3.027 4.316v1.604l-20.156 13.865c-2.071-2.262-5.049-3.678-8.355-3.678-6.277 0-11.36 5.087-11.36 11.357s5.083 11.356 11.36 11.356c6.265 0 11.348-5.087 11.348-11.356 0-1.818-0.436-3.544-1.193-5.066l18.353-12.622v44.299c0 2.561 2.089 4.646 4.647 4.646 2.564 0 4.646-2.085 4.646-4.646v-44.084l17.183 12.314c-0.91 1.632-1.437 3.524-1.437 5.529 0 6.283 5.087 11.357 11.351 11.357 6.273 0 11.36-5.074 11.36-11.357-1e-3 -6.269-5.088-11.347-11.362-11.347z'/%3E%3C/svg%3E%0A";
const STATION_ICON_WHITE =
  "data:image/svg+xml,%3Csvg width='100px' height='100px' enable-background='new 6.191 0 87.619 100' fill='%23000000' version='1.1' viewBox='6.191 0 87.619 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m82.447 57.766c-3.112 0-5.937 1.255-7.992 3.29l-19.102-13.687v-1.773c0-2.015-1.303-3.692-3.094-4.333v-18.671c5.521-0.768 9.769-5.509 9.769-11.236-1e-3 -6.266-5.082-11.356-11.361-11.356-6.266 0-11.348 5.091-11.348 11.355 0 5.727 4.247 10.468 9.77 11.236v18.688c-1.76 0.662-3.027 2.335-3.027 4.316v1.604l-20.156 13.865c-2.071-2.262-5.049-3.678-8.355-3.678-6.277 0-11.36 5.087-11.36 11.357s5.083 11.356 11.36 11.356c6.265 0 11.348-5.087 11.348-11.356 0-1.818-0.436-3.544-1.193-5.066l18.353-12.622v44.299c0 2.561 2.089 4.646 4.647 4.646 2.564 0 4.646-2.085 4.646-4.646v-44.084l17.183 12.314c-0.91 1.632-1.437 3.524-1.437 5.529 0 6.283 5.087 11.357 11.351 11.357 6.273 0 11.36-5.074 11.36-11.357-1e-3 -6.269-5.088-11.347-11.362-11.347z' fill='%23fff'/%3E%3C/svg%3E%0A";
