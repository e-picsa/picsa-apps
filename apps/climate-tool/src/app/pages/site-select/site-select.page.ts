import { Component, ViewChild } from '@angular/core';
// import { ClimateToolActions } from "src/app/store/climate-tool.actions";
import { SITES } from 'src/app/data';
import { ISite } from '@picsa/models/climate.models';
import { PicsaMapComponent, IBasemapOptions } from '@picsa/features/map/map';

@Component({
  selector: 'climate-site-select',
  templateUrl: './site-select.page.html',
  styleUrls: ['./site-select.page.scss']
})
export class SiteSelectPage {
  @ViewChild('picsaMap', { static: true }) picsaMap: PicsaMapComponent;
  mapOptions: L.MapOptions = { center: [-13.2543, 34.3015], zoom: 7 };
  basemapOptions: IBasemapOptions = {
    src: 'assets/mapTiles/raw/{z}/{x}/{y}.png',
    maxNativeZoom: 8
  };

  // called from html when onMapReady is triggered
  onMapReady() {
    this.populateSites();
  }

  populateSites() {
    console.log('adding sites');
    const { L, map } = this.picsaMap;
    for (const site of SITES) {
      const weatherIcon = this._getWeatherIcon();
      const marker = L.marker([site.latitude, site.longitude], {
        icon: weatherIcon
      });
      const container = L.DomUtil.create('div');
      const btn = L.DomUtil.create('button', '', container);
      btn.setAttribute('type', 'button');
      btn.innerHTML = `<div class="site-select-button">${site.name} 🡺</div>`;
      const popup = L.popup().setContent(btn);
      L.DomEvent.on(btn, 'click', btn => {
        this.selectSite(site);
      });
      marker.bindPopup(popup);
      marker.addTo(map);
      marker.on({
        click: e => {
          console.log('marker clicked', e);
        }
      });
    }
  }

  selectSite(site: ISite) {
    // this.actions.selectSite(site);
  }

  _getWeatherIcon() {
    return this.picsaMap.L.icon({
      iconUrl: 'assets/img/station.png',
      // shadowUrl: "assets/img/leaf-shadow.png",
      iconSize: [38, 38], // size of the icon
      shadowSize: [50, 64], // size of the shadow
      // location given from top-left corner of icon, with right positive x and down positive y
      iconAnchor: [20, 20], // point of the icon which will correspond to marker's location
      shadowAnchor: [4, 62], // the same for the shadow
      popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
    });
  }
}
