/* eslint-disable @typescript-eslint/no-explicit-any */
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NetworkService } from '@picsa/shared/services/core/network.service';
import * as maplibregl from 'maplibre-gl';

import { GeoJsonData, IMapMarker, PicsaMapComponent } from './map';

jest.mock('maplibre-gl', () => {
  const mapInstances: any[] = [];
  const markerInstances: any[] = [];
  class LngLatBounds {
    public coordinates: any[] = [];
    constructor(sw?: any, ne?: any) {
      if (sw !== undefined) this.coordinates.push(sw);
      if (ne !== undefined && ne !== sw) this.coordinates.push(ne);
    }
    extend(coord: any) {
      this.coordinates.push(coord);
      return this;
    }
  }
  class Marker {
    public element?: HTMLElement;
    public lngLat?: [number, number];
    public map?: any;
    public remove = jest.fn();
    constructor(options?: { element?: HTMLElement }) {
      this.element = options?.element;
      markerInstances.push(this);
    }
    setLngLat(lngLat: [number, number]) {
      this.lngLat = lngLat;
      return this;
    }
    addTo(map: any) {
      this.map = map;
      return this;
    }
  }
  class Map {
    public options: any;
    public sources: Record<string, any> = {};
    public layers: Record<string, any> = {};
    public handlers: Record<string, ((...args: any[]) => void)[]> = {};
    public zoom = 2;
    public setStyle = jest.fn();
    public setPaintProperty = jest.fn();
    public fitBounds = jest.fn();
    public flyTo = jest.fn();
    public resize = jest.fn();
    public remove = jest.fn();
    public getZoom = jest.fn(() => this.zoom);
    constructor(options: any) {
      this.options = options;
      mapInstances.push(this);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public addSource = jest.fn((id: string, source: any) => {
      this.sources[id] = source;
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public addLayer = jest.fn((layer: any, _before?: string) => {
      this.layers[layer.id] = layer;
    });
    public removeLayer = jest.fn((id: string) => {
      delete this.layers[id];
    });
    public removeSource = jest.fn((id: string) => {
      delete this.sources[id];
    });
    public on(event: string, cb: (...args: any[]) => void) {
      this.handlers[event] = [...(this.handlers[event] ?? []), cb];
      return this;
    }
    public isStyleLoaded() {
      return true;
    }
    public getSource(id: string) {
      return this.sources[id];
    }
    public getLayer(id: string) {
      return this.layers[id];
    }
    public getStyle() {
      return { layers: [] };
    }
    public emit(event: string, ...args: any[]) {
      for (const cb of this.handlers[event] ?? []) {
        cb(...args);
      }
    }
  }
  return { Map, Marker, LngLatBounds, __mapInstances: mapInstances, __markerInstances: markerInstances };
});

const mockMapInstances = () => (maplibregl as any).__mapInstances as any[];
const mockMarkerInstances = () => (maplibregl as any).__markerInstances as any[];
const activeMarkers = () => mockMarkerInstances().filter((m) => m.remove.mock.calls.length === 0);

const TEST_MARKERS: IMapMarker[] = [
  { _index: 0, latlng: [-15.5, 28.0], number: 1 },
  { _index: 1, latlng: [-13.5, 32.5], number: 2 },
];

const TEST_GEOJSON: GeoJsonData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Test District' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [28.0, -15.0],
            [29.0, -15.0],
            [29.0, -16.0],
            [28.0, -16.0],
            [28.0, -15.0],
          ],
        ],
      },
    },
  ],
};

describe('PicsaMapComponent (pure MapLibre)', () => {
  let fixture: ComponentFixture<PicsaMapComponent>;
  let component: PicsaMapComponent;
  let isOnline: WritableSignal<boolean | undefined>;

  const mockMap = () => mockMapInstances()[0];
  const setZoom = (zoom: number) => {
    mockMap().zoom = zoom;
  };

  // Maplibre fires callbacks outside angular change detection in production,
  // so emit the mocked event outside the zone to avoid recursive testbed ticks
  const emitLoad = () => {
    fixture.ngZone?.runOutsideAngular(() => mockMap().emit('load'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    mockMapInstances().length = 0;
    mockMarkerInstances().length = 0;
    isOnline = signal<boolean | undefined>(true);
    await TestBed.configureTestingModule({
      imports: [PicsaMapComponent],
      providers: [{ provide: NetworkService, useValue: { isOnline } }],
    }).compileComponents();
    fixture = TestBed.createComponent(PicsaMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component with an offline raster base style', () => {
    expect(component).toBeTruthy();
    expect(mockMapInstances().length).toBe(1);
    expect(component.map()).toBe(mockMapInstances()[0]);
    expect(component.mapReady()).toBe(false);
    const style = mockMapInstances()[0].options.style;
    expect(style.sources['picsa-local-tiles'].tiles).toEqual(['assets/mapTiles/raw/{z}/{x}/{y}.webp']);
  });

  it('marks the map ready and emits onMapReady on load', () => {
    const onReady = jest.fn();
    component.onMapReady.subscribe(onReady);
    emitLoad();
    expect(component.mapReady()).toBe(true);
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('keeps the offline raster below zoom 9 when online (no metered fetches)', () => {
    emitLoad();
    const map = mockMap();
    expect(map.setStyle).not.toHaveBeenCalledWith('https://tiles.openfreemap.org/styles/liberty');
  });

  it('switches to online vector style at zoom >= 9 when online', () => {
    setZoom(10);
    emitLoad();
    const map = mockMap();
    expect(map.setStyle).toHaveBeenCalledWith('https://tiles.openfreemap.org/styles/liberty');
    // no local raster underlay is attached (it would be hidden and waste fetches)
    map.emit('styledata');
    expect(map.sources['picsa-local-tiles']).toBeUndefined();
  });

  it('swaps back to offline raster when zooming out below 9', () => {
    setZoom(10);
    emitLoad();
    const map = mockMap();
    expect(map.setStyle).toHaveBeenCalledWith('https://tiles.openfreemap.org/styles/liberty');

    setZoom(5);
    map.emit('zoomend');
    expect(map.setStyle).toHaveBeenCalledWith(expect.objectContaining({ name: 'picsa-offline' }));
  });

  it('stays on offline raster when offline, even at high zoom', () => {
    isOnline.set(false);
    setZoom(12);
    emitLoad();
    const map = mockMap();
    expect(map.setStyle).not.toHaveBeenCalledWith('https://tiles.openfreemap.org/styles/liberty');
    // raster source caps at native zoom 8 so no missing-zoom tiles are fetched (overscaled instead)
    expect(map.options.style.sources['picsa-local-tiles'].maxzoom).toBe(8);
  });

  it('renders markers with [lng, lat] conversion and emits clicks', () => {
    const onClick = jest.fn();
    component.onMarkerClick.subscribe(onClick);
    fixture.componentRef.setInput('markers', TEST_MARKERS);
    emitLoad();
    const rendered = activeMarkers();
    expect(rendered.length).toBe(2);
    // [lat, lng] input converted to maplibre [lng, lat] order
    expect(rendered[0].lngLat).toEqual([28.0, -15.5]);
    expect(rendered[1].lngLat).toEqual([32.5, -13.5]);
    // marker numbers rendered into the dom element
    expect(rendered[0].element?.innerHTML).toContain('1');

    rendered[0].element?.click();
    expect(onClick).toHaveBeenCalledWith(TEST_MARKERS[0]);
  });

  it('highlights the active marker and flies to it', () => {
    fixture.componentRef.setInput('markers', TEST_MARKERS);
    emitLoad();
    const map = mockMapInstances()[0];

    component.setActiveMarker(TEST_MARKERS[1]);
    expect(map.flyTo).toHaveBeenCalledWith({ center: [32.5, -13.5], zoom: 8 });

    const rendered = activeMarkers();
    expect(rendered[1].element?.classList.contains('selected')).toBe(true);
    expect(rendered[0].element?.classList.contains('selected')).toBe(false);

    // selecting a second marker moves the highlight
    component.setActiveMarker(TEST_MARKERS[0]);
    expect(rendered[0].element?.classList.contains('selected')).toBe(true);
    expect(rendered[1].element?.classList.contains('selected')).toBe(false);
  });

  it('adds and removes geojson boundary layers', () => {
    emitLoad();
    const map = mockMapInstances()[0];
    component.addGeoJsonLayer('district-boundary', TEST_GEOJSON, {
      lineColor: 'brown',
      lineOpacity: 0.5,
      lineWidth: 1.5,
      fitBounds: true,
    });
    expect(map.addSource).toHaveBeenCalledWith('district-boundary', expect.objectContaining({ type: 'geojson' }));
    expect(map.layers['district-boundary-fill']).toBeTruthy();
    expect(map.layers['district-boundary-line']).toBeTruthy();
    // fitBounds called once for markers? none here, so boundary fit applies
    expect(map.fitBounds).toHaveBeenCalled();

    component.removeGeoJsonLayer('district-boundary');
    expect(map.layers['district-boundary-fill']).toBeUndefined();
    expect(map.layers['district-boundary-line']).toBeUndefined();
    expect(map.sources['district-boundary']).toBeUndefined();
  });
});
