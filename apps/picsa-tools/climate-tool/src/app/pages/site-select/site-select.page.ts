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
    const { climateTool, localisation } = this.configurationService.activeConfiguration;
    const filterFn = climateTool?.stationFilter;
    if (filterFn) {
      stations = stations.filter((station) => filterFn(station));
    } else {
      stations = stations.filter((station) => station.countryCode === localisation.country.code);
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
}
