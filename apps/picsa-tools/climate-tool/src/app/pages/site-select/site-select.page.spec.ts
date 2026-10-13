/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, Component, input, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ConfigurationService, IUserSettings } from '@picsa/configuration';
import { PicsaTranslateModule } from '@picsa/i18n';
import { IStationMeta } from '@picsa/models';
import { PicsaMapComponent } from '@picsa/shared/features/map/map';

import { ClimateDataService } from '../../services/climate-data.service';
import { SiteSelectPage } from './site-select.page';

jest.mock('maplibre-gl', () => {
  class LngLatBounds {
    public coordinates: any[] = [];
    extend(coord: any) {
      this.coordinates.push(coord);
      return this;
    }
  }
  class Marker {
    setLngLat() {
      return this;
    }
    addTo() {
      return this;
    }
    remove = jest.fn();
  }
  class Map {
    public zoom = 2;
    public scrollZoom = { disable: jest.fn(), enable: jest.fn() };
    public touchZoomRotate = { disableRotation: jest.fn(), enableRotation: jest.fn() };
    public isMoving = jest.fn(() => false);
    public easeTo = jest.fn();
    public fitBounds = jest.fn();
    public flyTo = jest.fn();
    public resize = jest.fn();
    public remove = jest.fn();
    public addLayer = jest.fn();
    public addSource = jest.fn();
    public getLayer = jest.fn();
    public getSource = jest.fn();
    public on = jest.fn();
  }
  return {
    LngLatBounds,
    Marker,
    Map,
  };
});

// eslint-disable-next-line @angular-eslint/component-selector
@Component({
  selector: 'picsa-map',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockPicsaMapComponent {
  markers = input<any[]>([]);
  mapReady = signal(true);
  addGeoJsonLayer = jest.fn();
  setActiveMarker = jest.fn();
}

describe('SiteSelectPage', () => {
  let fixture: ComponentFixture<SiteSelectPage>;
  let component: SiteSelectPage;
  let router: Router;
  let dataService: ClimateDataService;
  let configService: ConfigurationService;
  let userSettingsSignal: WritableSignal<IUserSettings>;

  const mockStations: IStationMeta[] = [
    {
      id: 'choma',
      name: 'Choma Met',
      latitude: -16.83,
      longitude: 26.98,
      countryCode: 'zm',
      location: ['CHOMA'],
      capabilities: {
        schemaVersion: 1,
        lastUpdated: '2024-01-01',
        contentHash: 'hash1',
        years: [1965, 2024],
        totalYears: 60,
        completeRainYears: 55,
      },
    },
    {
      id: 'batoka',
      name: 'Batoka',
      latitude: -16.78,
      longitude: 27.2,
      countryCode: 'zm',
      location: ['CHOMA'],
      capabilities: {
        schemaVersion: 1,
        lastUpdated: '2024-01-01',
        contentHash: 'hash2',
        years: [1970, 2020],
        totalYears: 50,
        completeRainYears: 40,
      },
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteSelectPage, PicsaTranslateModule.forRoot()],
      providers: [provideRouter([])],
    })
      .overrideComponent(SiteSelectPage, {
        remove: { imports: [PicsaMapComponent] },
        add: { imports: [MockPicsaMapComponent] },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    dataService = TestBed.inject(ClimateDataService);
    jest.spyOn(dataService, 'stations').mockReturnValue(mockStations);
    jest.spyOn(dataService, 'setPreferredStation').mockImplementation();

    configService = TestBed.inject(ConfigurationService);
    userSettingsSignal = signal<IUserSettings>({
      country_code: 'zm',
      location: [undefined, undefined, 'zm', undefined, 'southern', 'choma'],
    } as unknown as IUserSettings);
    (configService as any).userSettings = userSettingsSignal;
    jest.spyOn(configService, 'updateUserSettings').mockImplementation((update) => {
      userSettingsSignal.update((curr) => ({ ...curr, ...update }));
    });

    fixture = TestBed.createComponent(SiteSelectPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the site select page', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve selectedDistrict from user settings location', () => {
    const district = component.selectedDistrict();
    expect(district).toBeDefined();
    expect(district?.id).toBe('choma');
  });

  it('should update location and settings when handleLocationChanged is called', () => {
    const newLocation = [undefined, undefined, 'zm', undefined, 'southern', 'monze'];

    component.handleLocationChanged(newLocation);

    expect(component.selectedLocation()).toEqual(newLocation);
    expect(configService.updateUserSettings).toHaveBeenCalledWith({ location: newLocation });
  });

  it('should set preferred station and navigate when confirmAndNavigate is called', () => {
    const targetStation = mockStations[0];
    component.confirmAndNavigate(targetStation);

    expect(dataService.setPreferredStation).toHaveBeenCalledWith('choma');
    expect(router.navigate).toHaveBeenCalledWith(['./', 'choma'], expect.anything());
  });

  it('should toggle view and all stations visibility', () => {
    expect(component.view()).toBe('recommendation');
    component.toggleView();
    expect(component.view()).toBe('map');

    expect(component.showAllStations()).toBe(false);
    component.toggleAllStations();
    expect(component.showAllStations()).toBe(true);
  });
});
