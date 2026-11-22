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
  NgZone,
  OnDestroy,
  Output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { IStationMeta } from '@picsa/models';
import { NetworkService } from '@picsa/shared/services/core/network.service';
import * as maplibregl from 'maplibre-gl';

import { ensurePmtilesProtocol } from './pmtiles-protocol';
import {
  buildCountryDetailLayers,
  buildOfflineVectorStyle,
  COUNTRY_DETAIL_SOURCE_ID,
  getCountryPmtilesUrl,
  getOnlineFallbackMinZoom,
  normalizePmtilesCountryCode,
  PMTILES_GLOBAL_URL,
  PMTILES_GLYPHS_URL,
} from './pmtiles-style';

/***********************************************************************
 *  Default values and interfaces
 ***********************************************************************/
const MAP_DEFAULTS: Required<Pick<IMapOptions, 'center' | 'zoom'>> = {
  center: [0, 0],
  zoom: 2,
};

/**
 * Default zoom behavior: vector PMTiles render sharply at fractional zooms, so
 * smooth zooming is enabled by default. Flip `DEFAULT_DISCRETE_ZOOM` to `true`
 * to revert to integer zoom snapping (e.g. for touch-screen usability testing).
 */
export const DEFAULT_DISCRETE_ZOOM = false;
export const DEFAULT_ZOOM_SNAP = DEFAULT_DISCRETE_ZOOM ? 1 : 0;
export const DEFAULT_ENABLE_ONLINE_FALLBACK = true;

/** Online vector tiles rendered when connectivity is available past offline maxzoom */
const ONLINE_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

const GEOJSON_DEFAULT_COLOR = '#3388ff';
const MARKER_FOCUS_ZOOM = 8;

export interface IMapMarker<T = IStationMeta> {
  iconUrl?: string;
  /** Marker position as [latitude, longitude] (converted to [lng, lat] internally) */
  latlng: [number, number];
  /** Display number with icon */
  number?: number;
  /** Text label displayed next to or below the marker */
  label?: string;
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
  /** Interval to snap zoom levels to (default: 0 for smooth vector zoom; 1 when discrete) */
  zoomSnap?: number;
  /** Whether to use discrete wheel zooming anchored to mouse cursor (default: false) */
  discreteZoom?: boolean;
  /** Whether to allow drag-rotation (default: false for crisp 2D maps) */
  dragRotate?: boolean;
  /** Whether to switch to online vector tiles past offline archive maxzoom when online (default: true) */
  enableOnlineFallback?: boolean;
}
export interface IGeoJsonLayerOptions {
  lineColor?: string;
  fillColor?: string;
  lineOpacity?: number;
  fillOpacity?: number;
  lineWidth?: number;
  padding?: number;
  fitBounds?: boolean;
}

export type GeoJsonData = GeoJSON.FeatureCollection | GeoJSON.Feature | GeoJSON.Geometry | Record<string, any>;
export type IGeoJsonData = GeoJsonData;

/** Available colours for shared map boundary styles */
export type MapBoundaryColor = 'green';

/**
 * Shared boundary overlay styles, keyed by colour.
 * Presentation lives here (not in geo data) so map consumers share one definition.
 */
export const MAP_BOUNDARY_STYLES: Record<MapBoundaryColor, IGeoJsonLayerOptions> = {
  green: {
    lineColor: '#166534',
    lineWidth: 2,
    lineOpacity: 0.95,
    fillColor: '#166534',
    fillOpacity: 0.12,
    fitBounds: false,
  },
};

interface IRenderedMarker {
  marker: IMapMarker;
  mlMarker: maplibregl.Marker;
  element: HTMLElement;
}

const toLngLat = (latlng: [number, number]): [number, number] => [latlng[1], latlng[0]];

const boundsFromGeoJson = (geojson: GeoJsonData): maplibregl.LngLatBounds | null => {
  const bounds = new maplibregl.LngLatBounds();
  let hasCoordinates = false;
  const extendCoords = (coords: any) => {
    if (!Array.isArray(coords)) return;
    if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      bounds.extend([coords[0], coords[1]]);
      hasCoordinates = true;
      return;
    }
    for (const c of coords) {
      extendCoords(c);
    }
  };
  const extract = (data: any) => {
    if (!data) return;
    if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
      for (const f of data.features) extract(f);
    } else if (data.type === 'Feature' && data.geometry) {
      extract(data.geometry);
    } else if (data.coordinates) {
      extendCoords(data.coordinates);
    } else if (Array.isArray(data.geometries)) {
      for (const g of data.geometries) extract(g);
    }
  };
  extract(geojson);
  return hasCoordinates ? bounds : null;
};

const LOCATION_ICON_BLACK = `<svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
</svg>`;

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
  private ngZone = inject(NgZone);

  mapOptions = input<IMapOptions>({});
  markers = input<IMapMarker[]>([]);
  fitBoundsOnMarkerUpdate = input<boolean>(true);
  /** Optional active country code (e.g. 'mw', 'zm', 'zw') for offline country-detail PMTiles */
  countryCode = input<string | undefined>(undefined);

  public mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  // Native maplibre map instance, exposed for advanced use-cases
  public map = signal<maplibregl.Map | null>(null);
  public mapReady = signal(false);

  /** Track rendered markers to programatically update styles */
  private renderedMarkers: IRenderedMarker[] = [];
  private locationMarker: maplibregl.Marker | null = null;
  private selected: { marker?: IMapMarker } = {};

  /** Registry of geojson overlays, all rendered in the single map style */
  private geoJsonConfigs = new Map<string, { geojson: GeoJsonData; options: IGeoJsonLayerOptions }>();
  private activeCountryCode: string | undefined = undefined;
  /** Layer ids belonging to the offline PMTiles base style (toggled as a group) */
  private offlineLayerIds: string[] = [];
  /** Whether the online vector base is currently displayed (offline PMTiles otherwise) */
  private vectorBaseActive = false;
  /** Cached online vector style JSON, fetched once on first crossing into vector zoom */
  private vectorStyleJson: any = null;
  private vectorLoading = false;
  /** Whether the cached vector style's sources/layers have been added to the map */
  private vectorLayersAdded = false;
  /** Layer ids added from the online vector style (toggled as a group) */
  private vectorLayerIds: string[] = [];
  private onlineGlyphsUrl: string | undefined = undefined;
  private resizeObserver: ResizeObserver | null = null;
  private wheelListener?: (e: WheelEvent) => void;

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

    // Reactively toggle the base layer based on connection status from NetworkService
    effect(() => {
      if (this.mapReady()) {
        this.updateBaseStyle();
      }
    });

    // Reactively update the country-detail PMTiles source when countryCode changes
    effect(() => {
      const nextCode = this.countryCode();
      if (this.mapReady()) {
        this.setCountrySource(nextCode);
      }
    });
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    const container = this.mapContainer()?.nativeElement;
    if (this.wheelListener && container) {
      container.removeEventListener('wheel', this.wheelListener);
      this.wheelListener = undefined;
    }
    for (const { mlMarker } of this.renderedMarkers) {
      mlMarker.remove();
    }
    this.renderedMarkers = [];
    this.locationMarker?.remove();
    this.map()?.remove();
    this.map.set(null);
    this.mapReady.set(false);
  }

  /**
   * Set the active (selected) marker, highlighting it and optionally flying the camera to it.
   * @param forceZoom If true, forces zooming and centering even if already selected.
   * @param flyTo If false, updates active highlight without moving the camera.
   */
  public setActiveMarker(marker: IMapMarker, forceZoom = false, flyTo = true) {
    void forceZoom;
    this.selected = { marker };
    for (const rendered of this.renderedMarkers) {
      if (rendered.marker._index !== marker._index) {
        rendered.element.classList.remove('selected');
      } else {
        rendered.element.classList.add('selected');
      }
    }
    if (flyTo) {
      const map = this.map();
      map?.stop?.();
      map?.flyTo({ center: toLngLat(marker.latlng), zoom: MARKER_FOCUS_ZOOM });
    }
  }

  /**
   * Clear active marker selection, removing .selected class from all markers.
   */
  public clearActiveMarker() {
    this.selected = {};
    for (const rendered of this.renderedMarkers) {
      rendered.element.classList.remove('selected');
    }
  }

  /**
   * Zoom and center map to a specific marker at given zoom level (default 8, offline-safe)
   */
  public zoomToMarker(marker: IMapMarker, zoom = MARKER_FOCUS_ZOOM) {
    const map = this.map();
    map?.stop?.();
    map?.flyTo({ center: toLngLat(marker.latlng), zoom });
  }

  /**
   * Trigger a map resize calculation (e.g. after container visibility changes)
   */
  public resize() {
    this.map()?.resize();
  }

  /**
   * Add a single location pin to the map (e.g. user GPS location).
   */
  public setLocationMarker(lat: number, lng: number) {
    this.setLocation(lat, lng);
  }

  public setLocation(lat: number, lng: number) {
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
   * Overlays live in the single map style and are never removed except here,
   * so base layer visibility toggles cannot wipe them.
   * NOTE GeoJSON coordinates use [lng, lat] order
   */
  public addGeoJsonLayer(id: string, geojson: GeoJsonData, options: IGeoJsonLayerOptions = {}) {
    this.geoJsonConfigs.set(id, { geojson, options });
    this.applyGeoJsonLayer(id);
  }

  public removeGeoJsonLayer(id: string) {
    this.geoJsonConfigs.delete(id);
    const map = this.map();
    if (!map) return;
    try {
      for (const layerId of [`${id}-fill`, `${id}-line`]) {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    } catch (err) {
      console.warn(`[PicsaMap] Could not remove GeoJSON layer ${id}:`, err);
    }
  }

  /** Fit the map view to the given bounds ([[lng,lat],[lng,lat]] or LngLatBounds) */
  public fitBounds(bounds: maplibregl.LngLatBoundsLike, options?: maplibregl.FitBoundsOptions) {
    const map = this.map();
    if (!map) return;
    map.stop?.();
    map.fitBounds(bounds, options);
  }

  private initMap() {
    const container = this.mapContainer()?.nativeElement;
    if (!container || this.map()) return;

    this.ngZone.runOutsideAngular(() => {
      const {
        center,
        zoom,
        minZoom,
        maxZoom,
        zoomSnap = DEFAULT_ZOOM_SNAP,
        discreteZoom = DEFAULT_DISCRETE_ZOOM,
        dragRotate = false,
      } = { ...MAP_DEFAULTS, ...this.mapOptions() };

      const initialCountryCode = normalizePmtilesCountryCode(this.countryCode());
      this.activeCountryCode = initialCountryCode;
      this.registerOfflineArchives(initialCountryCode);
      const initialStyle = this.buildOfflineStyle(initialCountryCode);
      this.offlineLayerIds = initialStyle.layers.map((layer) => layer.id);

      const map = new maplibregl.Map({
        container,
        style: initialStyle,
        center: toLngLat(center),
        zoom,
        minZoom,
        maxZoom,
        zoomSnap,
        fadeDuration: 0,
        dragRotate,
      });

      // Collapse the attribution control synchronously (same task, before first
      // paint) so it never flashes expanded. MapLibre initialises it open and
      // re-expands on sourcedata unless the `compact` class is already present.
      this.collapseAttribution(container);

      // Defensive guard against MapLibre GL race condition where _stop() deletes _onEaseFrame
      // while another frame callback in the render queue executes during rapid gestures/station swapping
      const origRenderFrameCallback = (map as any)._renderFrameCallback;
      if (origRenderFrameCallback) {
        (map as any)._renderFrameCallback = () => {
          if (typeof (map as any)._onEaseFrame !== 'function') {
            return;
          }
          try {
            origRenderFrameCallback();
          } catch (err: any) {
            if (err instanceof TypeError && err?.message?.includes('_onEaseFrame')) {
              return;
            }
            throw err;
          }
        };
      }

      // Defensive guard against MapLibre GL re-entrant TaskQueue.run() calls during high-frequency panning
      const queue = (map as any)._renderTaskQueue;
      if (queue) {
        const origRun = queue.run.bind(queue);
        queue.run = (timeStamp?: number) => {
          if (queue._currentlyRunning) {
            return;
          }
          try {
            origRun(timeStamp);
          } catch (err: any) {
            queue._currentlyRunning = false;
            if (err?.message?.includes('Attempting to run(), but is already running')) {
              return;
            }
            throw err;
          }
        };
      }

      this.ngZone.run(() => {
        this.map.set(map);
      });

      if (!dragRotate) {
        map.touchZoomRotate?.disableRotation();
      }

      if (discreteZoom) {
        this.setupDiscreteWheelZoom(map, container);
      }

      // Ensure touch pinch-zooming and other gestures settle cleanly on integer zoom
      map.on('moveend', () => {
        if (!discreteZoom) return;
        const currentZoom = map.getZoom();
        const nearest = Math.round(currentZoom);
        if (Math.abs(currentZoom - nearest) > 0.02 && !map.isMoving()) {
          map.easeTo({ zoom: nearest, duration: 150 });
        }
      });

      map.on('load', () => {
        this.collapseAttribution(container);
        this.ngZone.run(() => {
          this.mapReady.set(true);
          this.updateBaseStyle();
          this.refreshMarkers();
          this.onMapReady.emit(map);
        });
      });
      // Re-evaluate the base style when zoom crosses the vector threshold
      map.on('zoomend', () => {
        this.ngZone.run(() => {
          this.updateBaseStyle();
        });
      });
    });
  }

  /**
   * Start the MapLibre attribution control collapsed (ⓘ) instead of expanded.
   * MapLibre always initialises it open and re-expands on sourcedata/styledata
   * unless the `compact` class is present — so ensure `compact` while stripping
   * `compact-show`/`open`. Later _updateCompact calls then no-op, and manual
   * expand via the toggle still works.
   */
  private collapseAttribution(container: HTMLElement) {
    const el = container.querySelector('details.maplibregl-ctrl-attrib');
    el?.classList.add('maplibregl-compact');
    el?.classList.remove('maplibregl-compact-show');
    el?.removeAttribute('open');
  }

  /**
   * Discrete wheel zooming that cleanly snaps to integer zoom intervals and
   * anchors (pans) around the mouse cursor coordinates instead of continuous smooth scrolling.
   */
  private setupDiscreteWheelZoom(map: maplibregl.Map, container: HTMLElement) {
    map.scrollZoom?.disable();

    let isZooming = false;
    const COOLDOWN_MS = 200;

    this.wheelListener = (e: WheelEvent) => {
      e.preventDefault();

      // Ignore tiny jitter
      if (Math.abs(e.deltaY) < 4) {
        return;
      }

      if (isZooming) {
        return;
      }

      isZooming = true;
      const direction = e.deltaY < 0 ? 1 : -1;
      const currentZoom = map.getZoom();
      const minZoom = map.getMinZoom?.() ?? 0;
      const maxZoom = map.getMaxZoom?.() ?? 22;

      let targetZoom: number;
      if (direction > 0) {
        targetZoom = Math.min(maxZoom, Math.floor(currentZoom + 1e-4) + 1);
      } else {
        targetZoom = Math.max(minZoom, Math.ceil(currentZoom - 1e-4) - 1);
      }

      if (targetZoom !== currentZoom) {
        const rect = container.getBoundingClientRect();
        const mousePoint: [number, number] = [e.clientX - rect.left, e.clientY - rect.top];
        const mouseLngLat = map.unproject(mousePoint);

        map.stop?.();
        map.easeTo({
          zoom: targetZoom,
          around: mouseLngLat,
          duration: 120,
        });
      }

      setTimeout(() => {
        isZooming = false;
      }, COOLDOWN_MS);
    };

    container.addEventListener('wheel', this.wheelListener, { passive: false });
  }

  /**
   * Show the online vector base at or above the country's offline maxzoom when
   * connected and `enableOnlineFallback` is enabled, else the packaged offline
   * PMTiles vector base. Both bases live in the single map style and are toggled
   * via visibility — the style itself is never replaced, so custom overlays are
   * never wiped. Invisible layers fetch no tiles, preserving offline-first bandwidth.
   */
  private updateBaseStyle() {
    const map = this.map();
    const isOnline = this.networkService.isOnline();
    if (!map || isOnline === undefined || !this.mapReady()) return;

    const allowOnline = this.mapOptions().enableOnlineFallback ?? DEFAULT_ENABLE_ONLINE_FALLBACK;
    const minOnlineZoom = getOnlineFallbackMinZoom(this.countryCode());
    const wantVector = allowOnline && isOnline && map.getZoom() >= minOnlineZoom;

    if (wantVector && !this.vectorLayersAdded) {
      // First crossing (or a previous attempt failed): fetch once, then apply.
      this.setupVectorBase();
      return;
    }
    if (wantVector !== this.vectorBaseActive) {
      this.setBaseVisibility(wantVector);
    }
  }

  /**
   * Lazily fetch the online vector style and add its sources/layers into the
   * live style (hidden until shown). The JSON is cached; failures leave the
   * offline PMTiles base in place and retry on the next crossing.
   */
  private setupVectorBase() {
    const map = this.map();
    if (!map || this.vectorLoading || this.vectorLayersAdded) return;
    if (this.vectorStyleJson) {
      this.addVectorBaseLayers(map, this.vectorStyleJson);
      this.updateBaseStyle();
      return;
    }
    this.vectorLoading = true;
    fetch(ONLINE_STYLE_URL)
      .then((res) => res.json())
      .then((json) => {
        const layers = Array.isArray(json?.layers) ? json.layers : [];
        this.vectorStyleJson = layers.length > 0 ? json : null;
      })
      .catch(() => {
        this.vectorStyleJson = null;
      })
      .finally(() => {
        this.vectorLoading = false;
        const currentMap = this.map();
        if (currentMap && this.vectorStyleJson && !this.vectorLayersAdded) {
          this.addVectorBaseLayers(currentMap, this.vectorStyleJson);
        }
        // Reveal only if setup actually completed. A failed fetch stays on
        // offline PMTiles and retries on the next crossing - never from here,
        // or failures would re-fetch in a tight loop.
        if (this.vectorLayersAdded) {
          this.updateBaseStyle();
        }
      });
  }

  /**
   * Add the cached online vector style's sources and layers into the live style,
   * inserted below any existing custom overlays so selections stay on top.
   * Sprite/glyphs only affect vector labels; geometry renders without them, so
   * each is applied independently and failures fall back gracefully.
   */
  private addVectorBaseLayers(map: maplibregl.Map, styleJson: any) {
    const sources = styleJson.sources ?? {};
    for (const [id, source] of Object.entries(sources)) {
      if (!map.getSource(id)) {
        map.addSource(id, source as maplibregl.SourceSpecification);
      }
    }
    try {
      if (styleJson.sprite) map.setSprite(styleJson.sprite);
    } catch {
      // Labels may lack icons; geometry unaffected.
    }
    this.onlineGlyphsUrl = typeof styleJson.glyphs === 'string' ? styleJson.glyphs : undefined;
    const insertBefore = this.getOverlayInsertBeforeId(map);
    const layers = Array.isArray(styleJson.layers) ? styleJson.layers : [];
    for (const layer of layers) {
      const layerDef = { ...(layer as Record<string, unknown>) };
      delete layerDef.slot;
      const id = layerDef.id;
      if (typeof id !== 'string' || !id || map.getLayer(id)) continue;
      map.addLayer(
        { ...layerDef, layout: { ...((layerDef.layout as object) ?? {}), visibility: 'none' } } as never,
        insertBefore,
      );
      this.vectorLayerIds.push(id);
    }
    this.vectorLayersAdded = this.vectorLayerIds.length > 0;
  }

  /**
   * Toggle between the packaged offline PMTiles vector layers and the online
   * vector base. Only visibility (and glyphs URL when switching) changes: no
   * sources or layers are removed, so custom overlays and camera stay intact.
   */
  private setBaseVisibility(showVector: boolean) {
    const map = this.map();
    if (!map) return;
    for (const id of this.vectorLayerIds) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', showVector ? 'visible' : 'none');
      }
    }
    for (const id of this.offlineLayerIds) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', showVector ? 'none' : 'visible');
      }
    }
    try {
      map.setGlyphs(showVector && this.onlineGlyphsUrl ? this.onlineGlyphsUrl : PMTILES_GLYPHS_URL);
    } catch {
      // Keep existing glyph URL if style is unavailable.
    }
    this.vectorBaseActive = showVector;
  }

  private getOverlayInsertBeforeId(map: maplibregl.Map): string | undefined {
    return [...this.geoJsonConfigs.keys()].map((id) => `${id}-fill`).find((fillId) => map.getLayer(fillId));
  }

  /**
   * Dynamically switch the active country PMTiles detail archive in the single
   * live style without disturbing online base layers or custom GeoJSON overlays.
   */
  public setCountrySource(countryCode?: string) {
    const nextCode = normalizePmtilesCountryCode(countryCode);
    if (nextCode === this.activeCountryCode) {
      return;
    }
    this.activeCountryCode = nextCode;
    this.registerOfflineArchives(nextCode);

    const map = this.map();
    if (!map) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const existingSource = map.getSource(COUNTRY_DETAIL_SOURCE_ID) as maplibregl.VectorTileSource | undefined;
      if (existingSource && nextCode && typeof existingSource.setUrl === 'function') {
        existingSource.setUrl(getCountryPmtilesUrl(nextCode));
      } else if (nextCode) {
        const countryLayers = buildCountryDetailLayers();
        if (!existingSource) {
          map.addSource(COUNTRY_DETAIL_SOURCE_ID, {
            type: 'vector',
            url: getCountryPmtilesUrl(nextCode),
          });
        }
        const insertBefore = this.vectorLayerIds.find((id) => map.getLayer(id)) ?? this.getOverlayInsertBeforeId(map);
        const visibility = this.vectorBaseActive ? 'none' : 'visible';
        for (const layer of countryLayers) {
          if (map.getLayer(layer.id)) continue;
          map.addLayer(
            { ...layer, layout: { ...((layer.layout as object) ?? {}), visibility } } as never,
            insertBefore,
          );
          this.offlineLayerIds.push(layer.id);
        }
      } else {
        const countryLayerIds = new Set(buildCountryDetailLayers().map((l) => l.id));
        for (const id of countryLayerIds) {
          if (map.getLayer(id)) {
            map.removeLayer(id);
          }
        }
        this.offlineLayerIds = this.offlineLayerIds.filter((id) => !countryLayerIds.has(id));
        if (existingSource) {
          map.removeSource(COUNTRY_DETAIL_SOURCE_ID);
        }
      }
    });

    this.updateBaseStyle();
  }

  private registerOfflineArchives(countryCode?: string) {
    const urls = [PMTILES_GLOBAL_URL];
    if (countryCode) {
      urls.push(getCountryPmtilesUrl(countryCode));
    }
    ensurePmtilesProtocol(urls);
  }

  /** Offline vector style backed by `global-base.pmtiles` and optional `{country}.pmtiles` */
  private buildOfflineStyle(countryCode = this.activeCountryCode): maplibregl.StyleSpecification {
    return buildOfflineVectorStyle(countryCode);
  }

  private applyGeoJsonLayer(id: string) {
    const map = this.map();
    const config = this.geoJsonConfigs.get(id);
    if (!map || !config) return;
    const { geojson, options } = config;
    try {
      const source = map.getSource(id) as maplibregl.GeoJSONSource | undefined;
      if (source && typeof source.setData === 'function') {
        source.setData(geojson as any);
      } else {
        if (source) {
          map.removeSource(id);
        }
        map.addSource(id, { type: 'geojson', data: geojson as any });
      }
      const fillColor = options.fillColor ?? 'rgba(0, 0, 0, 0)';
      const fillOpacity = options.fillOpacity ?? (options.fillColor ? 0.25 : 0);
      const lineColor = options.lineColor || GEOJSON_DEFAULT_COLOR;
      const fillLayerId = `${id}-fill`;
      const lineLayerId = `${id}-line`;
      if (!map.getLayer(fillLayerId)) {
        map.addLayer({
          id: fillLayerId,
          type: 'fill',
          source: id,
          paint: { 'fill-color': fillColor, 'fill-opacity': fillOpacity },
        });
      } else {
        map.setPaintProperty(fillLayerId, 'fill-color', fillColor);
        map.setPaintProperty(fillLayerId, 'fill-opacity', fillOpacity);
      }
      if (!map.getLayer(lineLayerId)) {
        map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: id,
          paint: {
            'line-color': lineColor,
            'line-opacity': options.lineOpacity ?? 0.8,
            'line-width': options.lineWidth ?? 3,
          },
        });
      } else {
        map.setPaintProperty(lineLayerId, 'line-color', lineColor);
        map.setPaintProperty(lineLayerId, 'line-opacity', options.lineOpacity ?? 0.8);
        map.setPaintProperty(lineLayerId, 'line-width', options.lineWidth ?? 3);
      }
      if (options.fitBounds) {
        const bounds = boundsFromGeoJson(geojson);
        if (bounds) {
          map.stop?.();
          map.fitBounds(bounds, { padding: options.padding ?? 30 });
        }
      }
    } catch (err) {
      console.warn(`[PicsaMap] Could not apply GeoJSON layer ${id}:`, err);
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
    if (markers.length > 0 && this.fitBoundsOnMarkerUpdate()) {
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
    map.stop?.();
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
    this.selected = { marker };
    // NOTE: no camera move here — the host owns the camera and frames the
    // selection in response to onMarkerClick (e.g. fitting combined location
    // and station bounds). Flying here would start a transition the host
    // immediately cancels and replaces.
    // Programatically update classnames on all markers to ensure single selection
    for (const rendered of this.renderedMarkers) {
      if (rendered.marker._index !== marker._index) {
        rendered.element.classList.remove('selected');
      } else {
        rendered.element.classList.add('selected');
      }
    }
    entry.element.classList.add('selected');
    this.ngZone.run(() => {
      this.onMarkerClick.emit(marker);
    });
  }
}
