import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewEncapsulation
} from '@angular/core';
import * as L from 'leaflet';
import * as GEOJSON from './geoJson';
import { GeoJsonObject, Feature, Geometry } from 'geojson';

@Component({
  selector: 'picsa-map',
  templateUrl: './map.html',
  styleUrls: ['./map.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PicsaMapComponent {
  @Output() onMapReady = new EventEmitter<L.Map>();
  @Input() set mapOptions(mapOptions: L.MapOptions) {
    this._mapOptions = { ...this._mapOptions, ...mapOptions };
    console.log('map options', this._mapOptions);
  }
  @Input() featuredCountry: IFeaturedCountry;
  @Input() basemapOptions: IBasemapOptions;
  // make native map element available directly
  public map: L.Map;

  // expose full leaflet functionality for use within parent components
  public L = L;

  // default options are overwritten via input setter
  protected _mapOptions: L.MapOptions = MAP_DEFAULTS;

  ngOnInit() {
    // initialise either web or local asset basemap
    const options = { ...BASEMAP_DEFAULTS, ...this.basemapOptions };
    const basemap = L.tileLayer(options.src, options);
    this._mapOptions = { ...MAP_DEFAULTS, layers: [basemap] };
  }

  // when the map is ready it emits event with map, and also binds map to
  // public api to be accessed by other services
  protected _onMapReady(map: L.Map) {
    this.map = map;
    if (this.featuredCountry) {
      this.addCountryFeatures(this.featuredCountry);
    }
    this.onMapReady.emit(map);
  }

  /***********************************************************************
   *  Country features geojson
   ***********************************************************************/
  private addCountryFeatures(country: IFeaturedCountry) {
    const geoJSON = this._getCountryGeoJson(country);
    const geojsonLayer = L.geoJSON(geoJSON, {
      onEachFeature: (feature, layer) => this.setFeature(feature, layer),
      style: GEOJSON_STYLE
    });
    geojsonLayer.addTo(this.map);
    // *** TODO - ADD METHOD TO CALCULATE AND AUTO FIT BOUNDS DEPENDENT ON USER
    this.map.fitBounds([[-13.4787, 35.77], [-14.797, 34.7358]]);
  }

  // when adding geoJson features want to set a label in the center of the feature
  // or possibly different location if not suitable
  private setFeature(feature: Feature<Geometry, any>, layer: L.Layer) {
    const overrides = {
      'TA Kapeni': [-15.60583, 35.00381],
      'TA Machinjili': [-15.67858, 35.07111]
    };

    layer.on({
      click: e => this.layerClick(e.target)
    });

    //automatically bind tooltips to centre of feature, unless want to manually specify from exceptions
    if (!overrides[feature.properties.NAME_1]) {
      layer.bindTooltip(feature.properties.NAME_1, {
        permanent: true,
        direction: 'center',
        className: 'countryLabel'
      });
    } else {
      const latLon = overrides[feature.properties.NAME_1];
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

  private layerClick(layer: L.Layer) {
    console.log('layer clicked', layer);
  }

  // add label in center of feature
  private addFeatureLabel() {}
  private addCustomLabel() {}

  private _getCountryGeoJson(country?: IFeaturedCountry): GeoJsonObject {
    switch (country) {
      case 'kenya':
        return null;
      case 'malawi':
        return GEOJSON.Malawi as GeoJsonObject;
      default:
        return null;
    }
  }
}

/***********************************************************************
 *  Default values and interfaces
 ***********************************************************************/
const BASEMAP_DEFAULTS: IBasemapOptions = {
  src: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  maxZoom: 18,
  attribution: 'Map data © OpenStreetMap contributors'
};

// L.tileLayer(
//   'assets/mapTiles/raw/{z}/{x}/{y}.png',
//   {
//     maxZoom: 18,
//     attribution: 'Map data © OpenStreetMap contributors',
//     maxNativeZoom: 8
//   }
// );
const MAP_DEFAULTS: L.MapOptions = {
  layers: [],
  zoom: 5,
  center: L.latLng(46.879966, -121.726909)
};

const GEOJSON_STYLE: L.PathOptions = {
  fillColor: '#f0d1b1',
  fillOpacity: 0.3,
  color: '#000000',
  opacity: 1,
  weight: 2
};

type IFeaturedCountry = 'malawi' | 'kenya';
interface IMapMarker {
  icon: 'weather';
  latlng: L.LatLngExpression;
}
export interface IBasemapOptions extends L.TileLayerOptions {
  src: string;
}
