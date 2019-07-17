import { Component } from '@angular/core';
import * as L from 'leaflet';
// import { ClimateToolActions } from "src/app/store/climate-tool.actions";
import { GEOJSON, SITES } from 'src/app/data/climate-tool.data';
import { ISite } from '@picsa/core/models/climate.models';
import { GeoJsonObject } from 'geojson';

@Component({
  selector: 'site-select',
  templateUrl: 'site-select.html'
})
export class SiteSelectComponent {
  map: any;

  constructor() // private actions: ClimateToolActions
  {}

  ngOnInit() {
    this.mapInit();
    this.sitesInit();
  }
  // create map base layers and set malawi geojson
  mapInit() {
    this.map = L.map('siteSelect', {
      attributionControl: false
    });
    const osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const osmAttrib =
      'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
    const osm = new L.TileLayer(osmUrl, {
      minZoom: 1,
      maxZoom: 15,
      attribution: osmAttrib
    });
    this.map.setView(new L.LatLng(-13.7, 34.9), 6);
    const geojsonLayer = L.geoJSON(GEOJSON.malawiAdmin as GeoJsonObject, {
      onEachFeature: this.setFeature.bind(this),
      style: this._getStyle()
    });
    geojsonLayer.addTo(this.map);
    // *** ADD METHOD TO CALCULATE AND AUTO FIT BOUNDS DEPENDENT ON USER
    this.map.fitBounds([[-13.4787, 35.77], [-14.797, 34.7358]]);
    // this.map.on('click',function(e){
    //   console.log('clicked')
    // })
  }

  sitesInit() {
    for (const site of SITES) {
      console.log('site', site);
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
      marker.addTo(this.map);
      marker.on({
        click: function(e) {
          console.log('marker clicked', e);
        }.bind(this)
      });
    }
  }

  setFeature(feature, layer) {
    const exceptions = {
      'TA Kapeni': [-15.60583, 35.00381],
      'TA Machinjili': [-15.67858, 35.07111]
    };
    layer.on({
      click: function(e) {
        this.layerClick(e.target);
      }.bind(this)
    });

    //automatically bind tooltips to centre of feature, unless want to manually specify from exceptions
    if (!exceptions[feature.properties.NAME_1]) {
      layer.bindTooltip(feature.properties.NAME_1, {
        permanent: true,
        direction: 'center',
        className: 'countryLabel'
      });
    } else {
      const latLon = exceptions[feature.properties.NAME_1];
      const label = L.marker(latLon, {
        icon: L.divIcon({
          html: '',
          iconSize: [0, 0]
        })
      }).addTo(this.map);
      label.bindTooltip(feature.properties.NAME_1, {
        permanent: true,
        direction: 'center',
        className: 'countryLabel'
      });
    }
  }

  layerClick(layer) {
    console.log('layer', layer);
    try {
      const NEBounds = _jsonObjectValues(layer._bounds._northEast);
      const SWBounds = _jsonObjectValues(layer._bounds._southWest);
      console.log('fitting bounds', NEBounds, SWBounds);
      this.map.fitBounds([NEBounds, SWBounds]);
    } catch (error) {
      console.error('could not fit bounds', error);
    }
  }

  _getStyle() {
    return {
      fillColor: '#f0d1b1',
      fillOpacity: 1,
      color: '#000000',
      opacity: 1,
      weight: 2
    };
  }
  selectSite(site: ISite) {
    // this.actions.selectSite(site);
  }
}

const weatherIcon = L.icon({
  iconUrl: 'assets/img/station.png',
  // shadowUrl: "assets/img/leaf-shadow.png",
  iconSize: [38, 38], // size of the icon
  shadowSize: [50, 64], // size of the shadow
  // location given from top-left corner of icon, with right positive x and down positive y
  iconAnchor: [20, 20], // point of the icon which will correspond to marker's location
  shadowAnchor: [4, 62], // the same for the shadow
  popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
});

function _jsonObjectValues(json: any) {
  const values = [];
  for (const key in json) {
    if (json.hasOwnProperty(key)) {
      values.push(json[key]);
    }
  }
  return values;
}
