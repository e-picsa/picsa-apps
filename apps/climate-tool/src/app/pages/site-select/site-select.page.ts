import { Component, ViewChild, NgZone } from '@angular/core';
import { SITES } from 'src/app/data';
import { ISite } from '@picsa/models/climate.models';
import {
  PicsaMapComponent,
  IBasemapOptions,
  IMapOptions,
  IMapMarker
} from '@picsa/features/map/map';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'climate-site-select',
  templateUrl: './site-select.page.html',
  styleUrls: ['./site-select.page.scss']
})
export class SiteSelectPage {
  activeSite: any;
  @ViewChild('picsaMap', { static: true }) picsaMap: PicsaMapComponent;
  mapOptions: IMapOptions = { center: [-13.2543, 34.3015], zoom: 7 };
  basemapOptions: IBasemapOptions = {
    src: 'assets/mapTiles/raw/{z}/{x}/{y}.png',
    maxNativeZoom: 8
  };

  constructor(
    private ngZone: NgZone,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  // called from html when onMapReady is triggered
  onMapReady() {
    this.populateSites();
  }
  onMarkerClick(marker: IMapMarker) {
    // linking to callback forces angular outside of usual cdr strategy/zone
    // so have to manually call ngZone.run to detect changes
    this.ngZone.run(() => {
      this.activeSite = { ...(marker.data as ISite) };
    });
  }

  goToSite(site: ISite) {
    this.ngZone.run(() => {
      this.router.navigate(['../', 'view', site._id], {
        relativeTo: this.route
      });
    });
  }

  populateSites() {
    const iconUrl = 'assets/img/station.png';
    const markers: IMapMarker[] = SITES.map(site => {
      return {
        iconUrl,
        latlng: [site.latitude, site.longitude],
        data: site
      };
    });
    this.picsaMap.addMarkers(markers);
  }
}
