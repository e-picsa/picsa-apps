/* eslint-disable @typescript-eslint/no-explicit-any */
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NetworkService } from '@picsa/shared/services/core/network.service';
import * as maplibregl from 'maplibre-gl';

import { GeoJsonData, IMapMarker, PicsaMapComponent } from './map';

jest.mock('maplibre-gl', () => {
  const mapInstances: any[] = [];
  const markerInstances: any[] = [];
  const protocols: Record<string, any> = {};
  const addProtocol = jest.fn((scheme: string, handler: any) => {
    protocols[scheme] = handler;
  });
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
    public scrollZoom = { disable: jest.fn(), enable: jest.fn() };
    public touchZoomRotate = { disableRotation: jest.fn(), enableRotation: jest.fn() };
    public isMoving = jest.fn(() => false);
    public easeTo = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public unproject = jest.fn((_pt?: any) => ({ lng: 28, lat: -15 }));
    public getMinZoom = jest.fn(() => 0);
    public getMaxZoom = jest.fn(() => 22);
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
  return {
    Map,
    Marker,
    LngLatBounds,
    addProtocol,
    __protocols: protocols,
    __mapInstances: mapInstances,
    __markerInstances: markerInstances,
  };
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

  it('creates the component with an offline PMTiles vector base style and registers the pmtiles protocol', () => {
    expect(component).toBeTruthy();
    expect(mockMapInstances().length).toBe(1);
    expect(component.map()).toBe(mockMapInstances()[0]);
    expect(component.mapReady()).toBe(false);
    expect((maplibregl as any).addProtocol).toHaveBeenCalledWith('pmtiles', expect.any(Function));

    const map = mockMapInstances()[0];
    expect(map.options.zoomSnap).toBe(0);
    expect(map.options.fadeDuration).toBe(0);
    expect(map.scrollZoom.disable).not.toHaveBeenCalled();

    const style = map.options.style;
    expect(style.sources['global-base']).toEqual(
      expect.objectContaining({
        type: 'vector',
        url: 'pmtiles://assets/mapTiles/global-base.pmtiles',
      }),
    );
    expect(style.sources['country-detail']).toBeUndefined();
    expect(style.glyphs).toBe('assets/mapTiles/fonts/{fontstack}/{range}.pbf');

    const cityLayer = style.layers.find((l: any) => l.id === 'global-place-city');
    expect(cityLayer?.layout?.['text-field']).toEqual(['coalesce', ['get', 'name:latin'], ['get', 'name']]);
  });

  it('includes country-detail source when countryCode is supported and swaps urls without rewriting layers', () => {
    fixture.componentRef.setInput('countryCode', 'mw');
    fixture.detectChanges();
    emitLoad();

    const map = mockMap();
    const countrySourceMock = { type: 'vector', url: 'pmtiles://assets/mapTiles/mw.pmtiles', setUrl: jest.fn() };
    map.sources['country-detail'] = countrySourceMock;

    // Switching to another supported country updates the source URL in-place
    fixture.componentRef.setInput('countryCode', 'zw');
    fixture.detectChanges();
    expect(countrySourceMock.setUrl).toHaveBeenCalledWith('pmtiles://assets/mapTiles/zw.pmtiles');

    // Switching to an unsupported/global country removes country-detail via setStyle
    fixture.componentRef.setInput('countryCode', 'global');
    fixture.detectChanges();
    expect(map.setStyle).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'picsa-offline',
        sources: expect.not.objectContaining({ 'country-detail': expect.anything() }),
      }),
    );
  });

  it('marks the map ready and emits onMapReady on load', () => {
    const onReady = jest.fn();
    component.onMapReady.subscribe(onReady);
    emitLoad();
    expect(component.mapReady()).toBe(true);
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('supports reverting to discrete wheel zoom anchored to mouse position via mapOptions', () => {
    const discreteFixture = TestBed.createComponent(PicsaMapComponent);
    discreteFixture.componentRef.setInput('mapOptions', { discreteZoom: true, zoomSnap: 1 });
    discreteFixture.detectChanges();

    const map = mockMapInstances()[1];
    expect(map.options.zoomSnap).toBe(1);
    expect(map.scrollZoom.disable).toHaveBeenCalled();

    const container = discreteFixture.componentInstance.mapContainer()?.nativeElement;
    expect(container).toBeDefined();
    if (!container) return;
    map.zoom = 3;

    // Wheel forward (zoom in)
    const zoomInEvent = new WheelEvent('wheel', {
      deltaY: -100,
      clientX: 200,
      clientY: 150,
      bubbles: true,
      cancelable: true,
    });
    container.dispatchEvent(zoomInEvent);

    expect(map.unproject).toHaveBeenCalled();
    expect(map.easeTo).toHaveBeenCalledWith(
      expect.objectContaining({
        zoom: 4,
        duration: 120,
        around: expect.anything(),
      }),
    );
  });

  it('disables touch rotation when dragRotate is false and snaps fractional touch zoom when discreteZoom is true', () => {
    const discreteFixture = TestBed.createComponent(PicsaMapComponent);
    discreteFixture.componentRef.setInput('mapOptions', { discreteZoom: true, zoomSnap: 1 });
    discreteFixture.detectChanges();

    const map = mockMapInstances()[1];
    expect(map.touchZoomRotate.disableRotation).toHaveBeenCalled();

    // Simulate map settling on a fractional zoom after mobile pinch zoom
    map.zoom = 3.4;
    map.handlers['moveend']?.forEach((fn: () => void) => fn());

    expect(map.easeTo).toHaveBeenCalledWith(
      expect.objectContaining({
        zoom: 3,
        duration: 150,
      }),
    );
  });

  it('steps zoom down discretely on wheel backward when discreteZoom is true', () => {
    const discreteFixture = TestBed.createComponent(PicsaMapComponent);
    discreteFixture.componentRef.setInput('mapOptions', { discreteZoom: true, zoomSnap: 1 });
    discreteFixture.detectChanges();

    const map = mockMapInstances()[1];
    const container = discreteFixture.componentInstance.mapContainer()?.nativeElement;
    expect(container).toBeDefined();
    if (!container) return;
    map.zoom = 5;

    const zoomOutEvent = new WheelEvent('wheel', {
      deltaY: 100,
      clientX: 200,
      clientY: 150,
      bubbles: true,
      cancelable: true,
    });
    container.dispatchEvent(zoomOutEvent);

    expect(map.easeTo).toHaveBeenCalledWith(
      expect.objectContaining({
        zoom: 4,
        duration: 120,
      }),
    );
  });

  it('keeps offline PMTiles active within country offline maxzoom even when online', () => {
    fixture.componentRef.setInput('countryCode', 'mw');
    fixture.detectChanges();
    setZoom(11);
    emitLoad();
    const map = mockMap();
    expect(map.setStyle).not.toHaveBeenCalledWith('https://tiles.openfreemap.org/styles/liberty');
  });

  it('switches to online vector style past offline archive maxzoom when online', () => {
    fixture.componentRef.setInput('countryCode', 'mw');
    fixture.detectChanges();
    setZoom(12);
    emitLoad();
    const map = mockMap();
    expect(map.setStyle).toHaveBeenCalledWith('https://tiles.openfreemap.org/styles/liberty');
  });

  it('swaps back to offline vector style when zooming back within country offline maxzoom', () => {
    fixture.componentRef.setInput('countryCode', 'zm');
    fixture.detectChanges();
    setZoom(10);
    emitLoad();
    const map = mockMap();
    expect(map.setStyle).toHaveBeenCalledWith('https://tiles.openfreemap.org/styles/liberty');

    setZoom(9);
    map.emit('zoomend');
    expect(map.setStyle).toHaveBeenCalledWith(expect.objectContaining({ name: 'picsa-offline' }));
  });

  it('stays on offline vector style when offline or when enableOnlineFallback is false', () => {
    fixture.componentRef.setInput('mapOptions', { enableOnlineFallback: false });
    fixture.detectChanges();
    setZoom(14);
    emitLoad();
    const map = mockMap();
    expect(map.setStyle).not.toHaveBeenCalledWith('https://tiles.openfreemap.org/styles/liberty');

    isOnline.set(false);
    fixture.componentRef.setInput('mapOptions', { enableOnlineFallback: true });
    fixture.detectChanges();
    map.emit('zoomend');
    expect(map.setStyle).not.toHaveBeenCalledWith('https://tiles.openfreemap.org/styles/liberty');
    expect(map.options.style.sources['global-base'].url).toBe('pmtiles://assets/mapTiles/global-base.pmtiles');
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
      lineWidth: 3,
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
