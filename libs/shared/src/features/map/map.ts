/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { IStationMeta } from '@picsa/models';
import * as L from 'leaflet';

@Component({
  imports: [LeafletModule],
  selector: 'picsa-map',
  templateUrl: './map.html',
  styleUrls: ['./map.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicsaMapComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  @Output() onMapReady = new EventEmitter<L.Map>();
  @Output() onLayerClick = new EventEmitter<L.Layer>();
  @Output() onMarkerClick = new EventEmitter<IMapMarker>();

  mapOptions = input<L.MapOptions>({});
  basemapOptions = input<Partial<IBasemapOptions>>({});
  markers = input<IMapMarker[]>([]);

  // make native map element available directly as signal
  public map = signal<L.Map>(null as any);

  // expose full leaflet functionality for use within parent components
  public L = L;

  /** Full set of map options merged from input options and default */
  public _mapOptions = signal<L.MapOptions>(null as any);

  /** Track markers that have been rendered to the map to programatically update styles */
  private renderedMarkers: L.Marker<any>[] = [];

  private selected: { marker?: IMapMarker; renderedMarker?: L.Marker<any> } = {};

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
    if (marker) {
      const { _index } = marker;
      const renderedMarker = this.renderedMarkers[_index];
      this._onMarkerClick(marker, renderedMarker);
    }
  }

  /** Render a marker for current user location */
  public setLocationMarker(lat: number, lng: number) {
    const icon = L.divIcon({
      iconSize: [38, 38], // size of the icon
      shadowSize: [50, 64], // size of the shadow
      // location given from top-left corner of icon, with right positive x and down positive y
      iconAnchor: [20, 20], // point of the icon which will correspond to marker's location
      shadowAnchor: [4, 62], // the same for the shadow
      popupAnchor: [0, 0], // point from which the popup should open relative to the iconAnchor
      className: 'location-icon secondary',
      html: L.Util.template(LOCATION_ICON_BLACK, 'color:white'),
    });
    const userMarker = L.marker([lat, lng], { icon });
    userMarker.addTo(this.map());
  }

  private addMarkers(markers: IMapMarker[], fitMap = true) {
    const renderedMarkers: L.Marker<any>[] = [];
    markers.forEach((marker) => {
      const icon = this.getMarkerIcon(marker);
      const renderedMarker = L.marker(marker.latlng, { icon });
      renderedMarkers.push(renderedMarker);
      renderedMarker.on({
        click: () => this._onMarkerClick(marker, renderedMarker),
      });
      renderedMarker.addTo(this.map());
    });
    if (fitMap && markers.length > 0) {
      this.fitMapToMarkers(markers);
    }
    this.renderedMarkers = renderedMarkers;
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
  private getMarkerIcon(marker: IMapMarker) {
    if (marker.number) {
      const icon = L.divIcon({
        html: `<div class="number-circle"><span class="number">${marker.number}</span></div>`,
        className: '',
        // Make icon click-box larger thann icon (which is 24px)
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });
      return icon;
    } else {
      console.warn('could not get marker icon', marker);
      return L.divIcon({ html: `` });
    }
  }

  // zoom in on layer click and emit event.
  // NOTE L.Layer doesn't recognize _bounds prop so just pass as any
  protected _onLayerClick(layer: any) {
    const bounds = layer._bounds as L.LatLngBounds;
    this.map().fitBounds(bounds);
    this.onLayerClick.emit(layer);
  }

  // when marker is clicked zoom in map on marker, update icon and emit event
  protected _onMarkerClick(marker: IMapMarker, renderedMarker: L.Marker<any>) {
    if (marker && renderedMarker) {
      // Fly map to marker
      const latLng = renderedMarker.getLatLng();
      this.map().flyTo(latLng, 12);

      // Programatically updated classnames on current and previous
      // selected marker. Use CDR to ensure updated
      renderedMarker.getElement()?.classList.add('selected');
      const { marker: prevMarker, renderedMarker: prevRenderedMarker } = this.selected;
      if (prevMarker && prevMarker._index !== marker._index) {
        prevRenderedMarker?.getElement()?.classList.remove('selected');
      }
      this.selected = { marker, renderedMarker };
      this.cdr.markForCheck();

      this.onMarkerClick.emit(marker);
    }
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

export interface IMapMarker<T = IStationMeta> {
  iconUrl?: string;
  latlng: L.LatLngTuple;
  /** Display number with icon */
  number?: number;
  data?: T;
  /** Index of station when rendered */
  _index: number;
}
export interface IBasemapOptions extends L.TileLayerOptions {
  src: string;
}
export type IMapOptions = L.MapOptions;

const LOCATION_ICON_BLACK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <circle cx="12" cy="12" r="4"/>
  <path d="M13 4.069V2h-2v2.069A8.01 8.01 0 0 0 4.069 11H2v2h2.069A8.008 8.008 0 0 0 11 19.931V22h2v-2.069A8.007 8.007 0 0 0 19.931 13H22v-2h-2.069A8.008 8.008 0 0 0 13 4.069zM12 18c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6z"/>
</svg>
`;
