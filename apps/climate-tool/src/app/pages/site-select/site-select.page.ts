import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { SITES } from 'src/app/data';
import { ISite } from '@picsa/models/climate.models';
import {
  PicsaMapComponent,
  IBasemapOptions,
  IMapOptions,
  IMapMarker
} from '@picsa/features/map/map';

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

  constructor(private cdr: ChangeDetectorRef) {}

  // called from html when onMapReady is triggered
  onMapReady() {
    this.populateSites();
  }
  onMarkerClick(marker: IMapMarker) {
    // strange bug why it isn't detecting changes in usual way
    // so force with object assignment and cdr. May work without
    // in future ng versions (CC 2019-07-19)
    this.activeSite = { ...(marker.data as ISite) };
    this.cdr.detectChanges();
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
