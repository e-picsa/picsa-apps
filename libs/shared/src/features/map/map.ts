import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewEncapsulation,
} from '@angular/core';
import * as L from 'leaflet';
import * as GEOJSON from './geoJson';
import type { GeoJsonObject, Feature, Geometry } from 'geojson';

@Component({
  selector: 'picsa-map',
  templateUrl: './map.html',
  styleUrls: ['./map.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PicsaMapComponent {
  @Output() onMapReady = new EventEmitter<L.Map>();
  @Output() onLayerClick = new EventEmitter<L.Layer>();
  @Output() onMarkerClick = new EventEmitter<IMapMarker>();
  @Input() mapOptions: L.MapOptions;
  @Input() basemapOptions: IBasemapOptions;
  // make native map element available directly
  public map: L.Map;
  // expose full leaflet functionality for use within parent components
  public L = L;
  // active marker used to toggle style classes
  private _activeMarker: L.Marker;
  // default options are overwritten via input setter
  _mapOptions: L.MapOptions = MAP_DEFAULTS;
  ngOnInit() {
    // the user provides basemap options separate to general map options, so combine here
    // define the basemap layer and then bind to the view component
    const basemapOptions = { ...BASEMAP_DEFAULTS, ...this.basemapOptions };
    const basemap = L.tileLayer(basemapOptions.src, basemapOptions);
    const mapOptions = { ...MAP_DEFAULTS, ...this.mapOptions };
    this._mapOptions = { ...mapOptions, layers: [basemap] };
  }

  public addMarkers(mapMarkers: IMapMarker[], popupContent?: HTMLDivElement) {
    mapMarkers.forEach((m, i) => {
      const icon = L.icon({
        ...ICON_DEFAULTS,
        iconUrl: m.iconUrl,
      });
      const activeIcon = L.icon({
        ...ACTIVE_ICON_DEFAULTS,
        iconUrl: m.iconUrl,
      });
      const marker = L.marker(m.latlng, { icon });
      if (m.numbered) {
        const toolTip = L.tooltip(NUMBER_TOOLTIP_DEFAULTS);
        marker
          .bindTooltip(toolTip)
          .setTooltipContent(`${i + 1}`)
          .openTooltip();
      }
      marker.on({
        click: () => this._onMarkerClick(m, marker, activeIcon, icon),
      });
      marker.addTo(this.map);
    });
  }

  /** Calculate a bounding rectangle that covers all points and fit within map */
  public fitMapToPoints(points: [number, number][]) {
    const latLngs = points.map((p) => L.latLng(p[0], p[1]));
    const bounds = new L.LatLngBounds(latLngs as any);
    this.map.fitBounds(bounds, { maxZoom: 8, padding: [10, 10] });
  }

  // when the map is ready it emits event with map, and also binds map to
  // public api to be accessed by other services
  _onMapReady(map: L.Map) {
    this.map = map;
    this.onMapReady.emit(map);
  }

  // zoom in on layer click and emit event.
  // NOTE L.Layer doesn't recognize _bounds prop so just pass as any
  protected _onLayerClick(layer: any) {
    const bounds = layer._bounds as L.LatLngBounds;
    this.map.fitBounds(bounds);
    this.onLayerClick.emit(layer);
  }

  // when marker is clicked notifiy event with original marker data
  protected _onMarkerClick(
    m: IMapMarker,
    marker: L.Marker,
    activeIcon: L.Icon,
    inactiveIcon: L.Icon
  ) {
    if (this._activeMarker) {
      this._activeMarker.setIcon(inactiveIcon);
    }
    marker.setIcon(activeIcon);
    this._activeMarker = marker;
    this.onMarkerClick.emit(m);
  }

  /***********************************************************************
   *  Country features geojson
   ***********************************************************************/
  private addCountryFeatures(country: IFeaturedCountry) {
    const geoJSON = this._getCountryGeoJson(country);
    const geojsonLayer = L.geoJSON(geoJSON, {
      onEachFeature: (feature, layer) => this.setFeature(feature, layer),
      style: GEOJSON_STYLE,
    });
    geojsonLayer.addTo(this.map);
    // *** TODO - ADD METHOD TO CALCULATE AND AUTO FIT BOUNDS DEPENDENT ON USER
  }

  private setFeature(feature: Feature<Geometry, any>, layer: L.Layer) {
    layer.on({
      click: () => this._onLayerClick(layer),
    });
  }

  private _getCountryGeoJson(country: IFeaturedCountry) {
    const mapping: { [country in IFeaturedCountry]: GeoJsonObject } = {
      kenya: null as any,
      malawi: GEOJSON.PicsaDefault as GeoJsonObject,
    };
    return mapping[country];
  }
}
/***********************************************************************
 *  Default values and interfaces
 ***********************************************************************/
const BASEMAP_DEFAULTS: IBasemapOptions = {
  src: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  maxZoom: 18,
  attribution: 'Map data © OpenStreetMap contributors',
};

const MAP_DEFAULTS: L.MapOptions = {
  layers: [],
  zoom: 5,
};

const GEOJSON_STYLE: L.PathOptions = {
  fillColor: '#000000',
  fillOpacity: 0.05,
  color: '#000000',
  opacity: 1,
  weight: 2,
};
const ICON_DEFAULTS: L.IconOptions = {
  iconUrl: '',
  // shadowUrl: "assets/img/leaf-shadow.png",
  iconSize: [38, 38], // size of the icon
  shadowSize: [50, 64], // size of the shadow
  // location given from top-left corner of icon, with right positive x and down positive y
  iconAnchor: [20, 20], // point of the icon which will correspond to marker's location
  shadowAnchor: [4, 62], // the same for the shadow
  popupAnchor: [0, 0], // point from which the popup should open relative to the iconAnchor
};
const ACTIVE_ICON_DEFAULTS: L.IconOptions = {
  ...ICON_DEFAULTS,
  iconAnchor: [24, 24],
  // make icon smaller so border can appear without shifting
  className: 'active',
};

const NUMBER_TOOLTIP_DEFAULTS: L.TooltipOptions = {
  className: 'number-tooltip',
  opacity: 1,
  permanent: true,
  direction: 'bottom',
  offset: new L.Point(0, 16),
};

type IFeaturedCountry = 'malawi' | 'kenya';
export interface IMapMarker {
  iconUrl: string;
  latlng: L.LatLngExpression;
  numbered?: boolean;
  data?: any;
}
export interface IBasemapOptions extends L.TileLayerOptions {
  src: string;
}
export type IMapOptions = L.MapOptions;
