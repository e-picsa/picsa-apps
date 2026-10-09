/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  EventEmitter,
  inject,
  input,
  OnDestroy,
  Output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { IStationMeta } from '@picsa/models';
import { NetworkService } from '@picsa/shared/services/core/network.service';
import * as maplibregl from 'maplibre-gl';

@Component({
  selector: 'picsa-map',
  templateUrl: './map.html',
  styleUrls: ['./map.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicsaMapComponent implements AfterViewInit, OnDestroy {
  @Output() onMapReady = new EventEmitter<maplibregl.Map>();
  @Output() onMarkerClick = new EventEmitter<IMapMarker>();

  private networkService = inject(NetworkService);

  mapOptions = input<IMapOptions>({});
  markers = input<IMapMarker[]>([]);

  public mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  // Native maplibre map instance, exposed for advanced use-cases
  public map = signal<maplibregl.Map | null>(null);
  public mapReady = signal(false);

  /** Track rendered markers to programatically update styles */
  private renderedMarkers: IRenderedMarker[] = [];
  private locationMarker: maplibregl.Marker | null = null;
  private selected: { marker?: IMapMarker } = {};

  /** Registry of geojson overlays, re-applied whenever the base style reloads */
  private geoJsonConfigs = new Map<string, { geojson: GeoJsonData; options: IGeoJsonLayerOptions }>();
  private currentStyleKind: 'offline' | 'online' | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    // Render input markers whenever markers change and the map is ready
    effect(() => {
      const inputMarkers = this.markers();
      if (this.mapReady()) {
        this.refreshMarkers(inputMarkers);
      }
    });
    // Observe layout size changes, use map resize method on change
    // to ensure map correctly setup. E.g. when switching tabs in farmer version
    effect((cleanup) => {
      const map = this.map();
      const container = this.mapContainer()?.nativeElement;
      if (!map || !container || typeof ResizeObserver === 'undefined') return;
      this.resizeObserver = new ResizeObserver(() => {
        map.resize();
      });
      this.resizeObserver.observe(container);
      cleanup(() => {
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
      });
    });

    // Reactively swap base styles based on connection status from NetworkService
    effect(() => {
      if (this.mapReady()) {
        this.updateBaseStyle();
      }
    });
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    for (const { mlMarker } of this.renderedMarkers) {
      mlMarker.remove();
    }
    this.renderedMarkers = [];
    this.locationMarker?.remove();
    this.map()?.remove();
    this.map.set(null);
    this.mapReady.set(false);
  }

  /** Programatically set the active map marker and trigger click callback */
  public setActiveMarker(marker: IMapMarker) {
    if (marker) {
      this._onMarkerClick(marker);
    }
  }

  /** Render a marker for current user location */
  public setLocationMarker(lat: number, lng: number) {
    const map = this.map();
    if (!map) return;
    this.locationMarker?.remove();
    const element = document.createElement('div');
    element.className = 'location-icon secondary';
    element.innerHTML = LOCATION_ICON_BLACK;
    this.locationMarker = new maplibregl.Marker({ element }).setLngLat([lng, lat]).addTo(map);
  }

  /**
   * Add (or update) a GeoJSON boundary overlay, e.g. country or district polygons.
   * Overlays survive base style swaps and are re-applied automatically.
   * NOTE GeoJSON coordinates use [lng, lat] order
   */
  public addGeoJsonLayer(id: string, geojson: GeoJsonData, options: IGeoJsonLayerOptions = {}) {
    this.geoJsonConfigs.set(id, { geojson, options });
    this.applyGeoJsonLayer(id);
  }

  public removeGeoJsonLayer(id: string) {
    this.geoJsonConfigs.delete(id);
    const map = this.map();
    if (!map || !map.isStyleLoaded()) return;
    for (const layerId of [`${id}-fill`, `${id}-line`]) {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    }
    if (map.getSource(id)) {
      map.removeSource(id);
    }
  }

  /** Fit the map view to the given bounds ([[lng,lat],[lng,lat]] or LngLatBounds) */
  public fitBounds(bounds: maplibregl.LngLatBoundsLike, options?: maplibregl.FitBoundsOptions) {
    this.map()?.fitBounds(bounds, options);
  }

  private initMap() {
    const container = this.mapContainer()?.nativeElement;
    if (!container || this.map()) return;
    const { center, zoom, minZoom, maxZoom } = { ...MAP_DEFAULTS, ...this.mapOptions() };
    const map = new maplibregl.Map({
      container,
      style: this.buildOfflineStyle(),
      center: toLngLat(center),
      zoom,
      minZoom,
      maxZoom,
    });
    this.currentStyleKind = 'offline';
    this.map.set(map);

    map.on('load', () => {
      this.mapReady.set(true);
      this.updateBaseStyle();
      this.refreshMarkers();
      this.onMapReady.emit(map);
    });
    // Re-evaluate the base style when zoom crosses the vector threshold
    map.on('zoomend', () => {
      this.updateBaseStyle();
    });
    // Custom sources and layers are cleared on every style swap, so re-apply
    map.on('styledata', () => {
      if (!this.map()) return;
      this.reapplyGeoJsonLayers();
    });
  }

  /**
   * Swap between packaged offline raster tiles and online vector tiles.
   * Vector tiles are only fetched when online AND zoomed past ONLINE_MIN_ZOOM,
   * preserving the pre-migration bandwidth profile (raster is bundled on-device,
   * vector is metered). Markers are plain HTML elements managed by maplibre so
   * stay in lockstep with the base map in both modes
   */
  private updateBaseStyle() {
    const map = this.map();
    const isOnline = this.networkService.isOnline();
    if (!map || isOnline === undefined) {
      return;
    }
    const useOnline = isOnline && map.getZoom() >= ONLINE_MIN_ZOOM;
    if (useOnline && this.currentStyleKind !== 'online') {
      this.currentStyleKind = 'online';
      map.setStyle(ONLINE_STYLE_URL);
    }
    if (!useOnline && this.currentStyleKind !== 'offline') {
      this.currentStyleKind = 'offline';
      map.setStyle(this.buildOfflineStyle());
    }
  }

  /** Offline raster style using packaged WebP tiles, auto-overscaled above native zoom */
  private buildOfflineStyle(): maplibregl.StyleSpecification {
    return {
      version: 8,
      name: 'picsa-offline',
      sources: {
        [LOCAL_SOURCE_ID]: {
          type: 'raster',
          tiles: [LOCAL_TILE_URL],
          tileSize: 256,
          maxzoom: LOCAL_MAX_NATIVE_ZOOM,
          attribution: 'Map data © OpenStreetMap contributors',
        },
      },
      layers: [{ id: LOCAL_LAYER_ID, type: 'raster', source: LOCAL_SOURCE_ID }],
    };
  }

  private reapplyGeoJsonLayers() {
    for (const id of this.geoJsonConfigs.keys()) {
      this.applyGeoJsonLayer(id);
    }
  }

  private applyGeoJsonLayer(id: string) {
    const map = this.map();
    const config = this.geoJsonConfigs.get(id);
    if (!map || !config || !map.isStyleLoaded()) return;
    const { geojson, options } = config;
    if (map.getSource(id)) {
      (map.getSource(id) as maplibregl.GeoJSONSource).setData(geojson as any);
    } else {
      map.addSource(id, { type: 'geojson', data: geojson as any });
    }
    const fillColor = options.fillColor || '';
    const lineColor = options.lineColor || GEOJSON_DEFAULT_COLOR;
    const fillLayerId = `${id}-fill`;
    const lineLayerId = `${id}-line`;
    if (!map.getLayer(fillLayerId)) {
      map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: id,
        paint: { 'fill-color': fillColor, 'fill-opacity': options.fillOpacity ?? 0.25 },
      });
    } else {
      map.setPaintProperty(fillLayerId, 'fill-color', fillColor);
      map.setPaintProperty(fillLayerId, 'fill-opacity', options.fillOpacity ?? 0.25);
    }
    if (!map.getLayer(lineLayerId)) {
      map.addLayer({
        id: lineLayerId,
        type: 'line',
        source: id,
        paint: {
          'line-color': lineColor,
          'line-opacity': options.lineOpacity ?? 0.8,
          'line-width': options.lineWidth ?? 28,
        },
      });
    } else {
      map.setPaintProperty(lineLayerId, 'line-color', lineColor);
      map.setPaintProperty(lineLayerId, 'line-opacity', options.lineOpacity ?? 0.8);
      map.setPaintProperty(lineLayerId, 'line-width', options.lineWidth ?? 28);
    }
    if (options.fitBounds) {
      const bounds = boundsFromGeoJson(geojson);
      if (bounds) {
        map.fitBounds(bounds, { padding: options.padding ?? 30 });
      }
    }
  }

  private refreshMarkers(markers: IMapMarker[] = this.markers()) {
    const map = this.map();
    if (!map) return;
    for (const { mlMarker } of this.renderedMarkers) {
      mlMarker.remove();
    }
    this.renderedMarkers = [];
    this.selected = {};
    markers.forEach((marker) => {
      const element = this.createMarkerElement(marker);
      element.addEventListener('click', () => this._onMarkerClick(marker));
      const mlMarker = new maplibregl.Marker({ element }).setLngLat(toLngLat(marker.latlng)).addTo(map);
      this.renderedMarkers.push({ marker, mlMarker, element });
    });
    if (markers.length > 0) {
      this.fitMapToMarkers(markers);
    }
  }

  /** Generate default (inactive) and active icons for a marker */
  private createMarkerElement(marker: IMapMarker) {
    if (marker.number === undefined) {
      console.warn('could not get marker icon', marker);
    }
    const element = document.createElement('div');
    element.className = 'picsa-map-marker';
    element.innerHTML = `<div class="number-circle"><span class="number">${marker.number ?? ''}</span></div>`;
    return element;
  }

  /** Calculate a bounding rectangle that covers all points and fit within map */
  private fitMapToMarkers(markers: IMapMarker[]) {
    const map = this.map();
    if (!map || markers.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    for (const marker of markers) {
      bounds.extend(toLngLat(marker.latlng));
    }
    map.fitBounds(bounds, { maxZoom: 8, padding: 10 });
  }

  // when marker is clicked zoom in map on marker, update icon and emit event
  protected _onMarkerClick(marker: IMapMarker) {
    const entry = this.renderedMarkers.find((rendered) => rendered.marker._index === marker._index);
    if (!marker || !entry) {
      return;
    }
    // skip duplicate action
    if (this.selected.marker?._index === marker._index) {
      return;
    }
    const prevEntry = this.renderedMarkers.find((rendered) => rendered.marker._index === this.selected.marker?._index);
    this.selected = { marker };
    // Fly map to marker
    this.map()?.flyTo({ center: toLngLat(marker.latlng), zoom: MARKER_FOCUS_ZOOM });
    // Programatically update classnames on current and previous selected marker
    entry.element.classList.add('selected');
    prevEntry?.element.classList.remove('selected');
    this.onMarkerClick.emit(marker);
  }
}
/***********************************************************************
 *  Default values and interfaces
 ***********************************************************************/
const MAP_DEFAULTS: Required<Pick<IMapOptions, 'center' | 'zoom'>> = {
  center: [0, 0],
  zoom: 2,
};

/** Packaged offline raster tiles (native zoom 0-8, overscaled by the renderer above) */
const LOCAL_TILE_URL = 'assets/mapTiles/raw/{z}/{x}/{y}.webp';
const LOCAL_MAX_NATIVE_ZOOM = 8;
const LOCAL_SOURCE_ID = 'picsa-local-tiles';
const LOCAL_LAYER_ID = 'picsa-local-layer';

/** Online vector tiles rendered when connectivity is available */
const ONLINE_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
/** Vector tiles are only fetched at or above this zoom (raster covers lower zooms) */
const ONLINE_MIN_ZOOM = 9;

const GEOJSON_DEFAULT_COLOR = '#3388ff';
const MARKER_FOCUS_ZOOM = 8;

export interface IMapMarker<T = IStationMeta> {
  iconUrl?: string;
  /** Marker position as [latitude, longitude] (converted to [lng, lat] internally) */
  latlng: [number, number];
  /** Display number with icon */
  number?: number;
  data?: T;
  /** Index of station when rendered */
  _index: number;
}

/** Subset of map configuration supported by PicsaMapComponent */
export interface IMapOptions {
  /** Map center as [latitude, longitude] */
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
}
export interface IGeoJsonLayerOptions {
  lineColor?: string;
  lineOpacity?: number;
  lineWidth?: number;
  fillColor?: string;
  fillOpacity?: number;
  /** Fit the map view to the layer bounds when added */
  fitBounds?: boolean;
  padding?: number;
}

/** Minimal GeoJSON shapes (loosely typed to accept domain converters, cast internally for maplibre) */
export interface GeoJsonFeature {
  type: string;
  properties?: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown };
}
export interface GeoJsonFeatureCollection {
  type: string;
  features: GeoJsonFeature[];
}
export type GeoJsonData = GeoJsonFeature | GeoJsonFeatureCollection;

interface IRenderedMarker {
  marker: IMapMarker;
  mlMarker: maplibregl.Marker;
  element: HTMLElement;
}

/** Convert a [lat, lng] tuple to maplibre [lng, lat] order */
function toLngLat(latlng: [number, number]): [number, number] {
  return [latlng[1], latlng[0]];
}

/** Extract all [lng, lat] positions from GeoJSON features and geometries */
function extractLngLats(data: unknown, bucket: [number, number][] = []): [number, number][] {
  if (Array.isArray(data)) {
    if (typeof data[0] === 'number' && typeof data[1] === 'number') {
      bucket.push([data[0], data[1]]);
      return bucket;
    }
    for (const child of data) {
      extractLngLats(child, bucket);
    }
    return bucket;
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    // walk known GeoJSON containers only, skipping properties and other metadata
    if (Array.isArray(record.features)) {
      for (const feature of record.features) {
        extractLngLats(feature, bucket);
      }
    } else if (record.geometry) {
      extractLngLats(record.geometry, bucket);
    } else if (Array.isArray(record.coordinates)) {
      extractLngLats(record.coordinates, bucket);
    }
  }
  return bucket;
}

function boundsFromGeoJson(geojson: GeoJsonData): maplibregl.LngLatBounds | null {
  const coords = extractLngLats(geojson).filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
  if (coords.length === 0) return null;
  const bounds = new maplibregl.LngLatBounds(coords[0], coords[0]);
  for (const coord of coords) {
    bounds.extend(coord);
  }
  return bounds;
}

const LOCATION_ICON_BLACK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <circle cx="12" cy="12" r="4"/>
  <path d="M13 4.069V2h-2v2.069A8.01 8.01 0 0 0 4.069 11H2v2h2.069A8.008 8.008 0 0 0 11 19.931V22h2v-2.069A8.007 8.007 0 0 0 19.931 13H22v-2h-2.069A8.008 8.008 0 0 0 13 4.069zM12 18c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6z"/>
</svg>
`;
