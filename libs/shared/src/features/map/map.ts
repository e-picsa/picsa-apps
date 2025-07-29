import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  EventEmitter,
  input,
  OnInit,
  Output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';

@Component({
  imports: [CommonModule, LeafletModule],
  selector: 'picsa-map',
  templateUrl: './map.html',
  styleUrls: ['./map.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicsaMapComponent implements OnInit {
  @Output() onMapReady = new EventEmitter<L.Map>();
  @Output() onLayerClick = new EventEmitter<L.Layer>();
  @Output() onMarkerClick = new EventEmitter<IMapMarker>();

  mapOptions = input<L.MapOptions>({});
  basemapOptions = input<Partial<IBasemapOptions>>({});
  markers = input<IMapMarker[]>([]);

  /** List of rendered markers with map data */
  private renderedMarkers: L.Marker[] = [];

  // make native map element available directly as signal
  public map = signal<L.Map>(null as any);

  // expose full leaflet functionality for use within parent components
  public L = L;
  // active marker used to toggle style classes
  private _activeMarker: L.Marker;

  /** Full set of map options merged from input options and default */
  public _mapOptions = signal<L.MapOptions>(null as any);

  constructor() {
    // Load any input markers whenever both markers and map exist
    effect(() => {
      const inputMarkers = this.markers();
      const map = this.map();
      if (map && inputMarkers?.length > 0) {
        this.addMarkers(inputMarkers);
      }
    });
    // Observe layout size changes, use map invalidate method on change
    // to ensure map correctly setup. E.g. when switching tabs in farmer version
    effect((cleanup) => {
      if (!this.map()) return;
      const container = this.map().getContainer();
      const observer = new ResizeObserver(() => {
        this.map().invalidateSize();
      });
      observer.observe(container);
      cleanup(() => {
        observer.disconnect();
      });
    });
  }

  ngOnInit() {
    // the user provides basemap options separate to general map options, so combine here
    // define the basemap layer and then bind to the view component
    const basemapOptions = { ...BASEMAP_DEFAULTS, ...this.basemapOptions };
    const basemap = L.tileLayer(basemapOptions.src, basemapOptions);
    const mapOptions = { ...MAP_DEFAULTS, ...this.mapOptions };
    this._mapOptions.set({ ...mapOptions, layers: [basemap] });
  }

  /** Programatically set the active map marker and trigger click callback */
  public setActiveMarker(marker: IMapMarker) {
    const { _index } = marker;
    this._onMarkerClick(this.markers()[_index], this.renderedMarkers[_index]);
  }

  /** Render a marker for current user location */
  public setLocationMarker(lat: number, lng: number) {
    const icon = L.divIcon({
      ...ICON_DEFAULTS,
      className: 'location-icon secondary',
      html: L.Util.template(LOCATION_ICON_BLACK, 'color:white'),
    });
    const userMarker = L.marker([lat, lng], { icon });
    userMarker.addTo(this.map());
  }

  private addMarkers(mapMarkers: IMapMarker[], fitMap = true) {
    this.renderedMarkers = [];
    mapMarkers.forEach((m, i) => {
      const { icon } = this.getMarkerIcons(m);
      const marker = L.marker(m.latlng, { icon });
      if (m.number) {
        const toolTip = L.tooltip(NUMBER_TOOLTIP_DEFAULTS);
        marker.bindTooltip(toolTip).setTooltipContent(`${m.number}`).openTooltip();
      }
      marker.on({
        click: () => this._onMarkerClick(m, marker),
      });
      marker.addTo(this.map());
      this.renderedMarkers.push(marker);
    });
    if (fitMap && mapMarkers.length > 0) {
      this.fitMapToMarkers(mapMarkers);
    }
  }

  // when the map is ready it emits event with map, and also binds map to
  // public api to be accessed by other services
  _onMapReady(map: L.Map) {
    this.map.set(map);
    this.onMapReady.emit(map);
  }

  /** Calculate a bounding rectangle that covers all points and fit within map */
  private fitMapToMarkers(markers: IMapMarker[]) {
    const latLngs = markers.map((m) => m.latlng);
    const bounds = new L.LatLngBounds(latLngs as any);
    this.map().fitBounds(bounds, { maxZoom: 8, padding: [10, 10] });
  }

  /** Generate default (inactive) and active icons for a marker */
  private getMarkerIcons(marker: IMapMarker) {
    const icon = L.icon({
      ...ICON_DEFAULTS,
      iconUrl: marker.iconUrl || STATION_ICON_WHITE,
    });
    const activeIcon = L.icon({
      ...ACTIVE_ICON_DEFAULTS,
      iconUrl: marker.iconUrl || STATION_ICON_WHITE,
    });
    return { icon, activeIcon };
  }

  // zoom in on layer click and emit event.
  // NOTE L.Layer doesn't recognize _bounds prop so just pass as any
  protected _onLayerClick(layer: any) {
    const bounds = layer._bounds as L.LatLngBounds;
    this.map().fitBounds(bounds);
    this.onLayerClick.emit(layer);
  }

  // when marker is clicked zoom in map on marker, update icon and emit event
  protected _onMarkerClick(m: IMapMarker, marker: L.Marker) {
    const { activeIcon, icon } = this.getMarkerIcons(m);
    if (this._activeMarker) {
      this._activeMarker.setIcon(icon);
    }
    const [lat, lng] = m.latlng;
    this.map().flyTo([lat, lng], 10);
    marker.setIcon(activeIcon);
    this._activeMarker = marker;
    this.onMarkerClick.emit(m);
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
  zoom: 2,
  center: [0, 0],
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
  iconUrl?: string;
  latlng: L.LatLngTuple;
  /** Display number with icon */
  number?: number;
  data?: any;
  /** Index of station when rendered */
  _index: number;
}
export interface IBasemapOptions extends L.TileLayerOptions {
  src: string;
}
export type IMapOptions = L.MapOptions;

// svg icon hardcoded to data uri
const STATION_ICON_BLACK =
  "data:image/svg+xml,%3Csvg width='100px' height='100px' enable-background='new 6.191 0 87.619 100' fill='%23000000' version='1.1' viewBox='6.191 0 87.619 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m82.447 57.766c-3.112 0-5.937 1.255-7.992 3.29l-19.102-13.687v-1.773c0-2.015-1.303-3.692-3.094-4.333v-18.671c5.521-0.768 9.769-5.509 9.769-11.236-1e-3 -6.266-5.082-11.356-11.361-11.356-6.266 0-11.348 5.091-11.348 11.355 0 5.727 4.247 10.468 9.77 11.236v18.688c-1.76 0.662-3.027 2.335-3.027 4.316v1.604l-20.156 13.865c-2.071-2.262-5.049-3.678-8.355-3.678-6.277 0-11.36 5.087-11.36 11.357s5.083 11.356 11.36 11.356c6.265 0 11.348-5.087 11.348-11.356 0-1.818-0.436-3.544-1.193-5.066l18.353-12.622v44.299c0 2.561 2.089 4.646 4.647 4.646 2.564 0 4.646-2.085 4.646-4.646v-44.084l17.183 12.314c-0.91 1.632-1.437 3.524-1.437 5.529 0 6.283 5.087 11.357 11.351 11.357 6.273 0 11.36-5.074 11.36-11.357-1e-3 -6.269-5.088-11.347-11.362-11.347z'/%3E%3C/svg%3E%0A";

const STATION_ICON_WHITE =
  "data:image/svg+xml,%3Csvg width='100px' height='100px' enable-background='new 6.191 0 87.619 100' fill='%23000000' version='1.1' viewBox='6.191 0 87.619 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m82.447 57.766c-3.112 0-5.937 1.255-7.992 3.29l-19.102-13.687v-1.773c0-2.015-1.303-3.692-3.094-4.333v-18.671c5.521-0.768 9.769-5.509 9.769-11.236-1e-3 -6.266-5.082-11.356-11.361-11.356-6.266 0-11.348 5.091-11.348 11.355 0 5.727 4.247 10.468 9.77 11.236v18.688c-1.76 0.662-3.027 2.335-3.027 4.316v1.604l-20.156 13.865c-2.071-2.262-5.049-3.678-8.355-3.678-6.277 0-11.36 5.087-11.36 11.357s5.083 11.356 11.36 11.356c6.265 0 11.348-5.087 11.348-11.356 0-1.818-0.436-3.544-1.193-5.066l18.353-12.622v44.299c0 2.561 2.089 4.646 4.647 4.646 2.564 0 4.646-2.085 4.646-4.646v-44.084l17.183 12.314c-0.91 1.632-1.437 3.524-1.437 5.529 0 6.283 5.087 11.357 11.351 11.357 6.273 0 11.36-5.074 11.36-11.357-1e-3 -6.269-5.088-11.347-11.362-11.347z' fill='%23fff'/%3E%3Ccircle cx='50' cy='50' r='14' fill='%23ff0000'/%3E%3C/svg%3E%0A";

const LOCATION_ICON_BLACK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <circle cx="12" cy="12" r="4"/>
  <path d="M13 4.069V2h-2v2.069A8.01 8.01 0 0 0 4.069 11H2v2h2.069A8.008 8.008 0 0 0 11 19.931V22h2v-2.069A8.007 8.007 0 0 0 19.931 13H22v-2h-2.069A8.008 8.008 0 0 0 13 4.069zM12 18c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6z"/>
</svg>
`;
