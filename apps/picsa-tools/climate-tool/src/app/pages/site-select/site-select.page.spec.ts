import { ChangeDetectionStrategy, Component, Input, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideRouter, Router } from '@angular/router';
import { ConfigurationService, IUserSettings } from '@picsa/configuration';
import { PicsaTranslateModule } from '@picsa/i18n';
import { IStationMeta } from '@picsa/models';
import { PicsaMapComponent } from '@picsa/shared/features/map/map';
import { of } from 'rxjs';

import { ClimateDataService } from '../../services/climate-data.service';
import { SiteSelectPage } from './site-select.page';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'picsa-map',
  template: '<div>Mock Map</div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockPicsaMapComponent {
  @Input() markers: unknown;
  fitBounds = jest.fn();
  setActiveMarker = jest.fn();
  clearActiveMarker = jest.fn();
  addGeoJsonLayer = jest.fn();
  removeGeoJsonLayer = jest.fn();
  setLocationMarker = jest.fn();
}

describe('SiteSelectPage', () => {
  let component: SiteSelectPage;
  let fixture: ComponentFixture<SiteSelectPage>;
  let router: Router;
  let dataService: ClimateDataService;
  let configService: ConfigurationService;
  let userSettingsSignal: WritableSignal<IUserSettings>;

  const mockStations: IStationMeta[] = [
    {
      id: 'choma',
      name: 'Choma',
      latitude: -16.8,
      longitude: 26.98,
      countryCode: 'zm',
      location: ['CHOMA'],
      capabilities: {
        schemaVersion: 1,
        lastUpdated: '2024-01-01',
        contentHash: 'hash1',
        years: [1970, 2020],
        totalYears: 50,
        completeRainYears: 45,
      },
    },
    {
      id: 'batoka',
      name: 'Batoka',
      latitude: -16.85,
      longitude: 27.1,
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
    {
      id: 'chipata',
      name: 'Chipata',
      latitude: -13.55,
      longitude: 32.58,
      countryCode: 'zm',
      location: ['CHIPATA'],
      capabilities: {
        schemaVersion: 1,
        lastUpdated: '2024-01-01',
        contentHash: 'hash3',
        years: [1970, 2020],
        totalYears: 50,
        completeRainYears: 45,
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
    jest.spyOn(dataService, 'allStations').mockReturnValue(mockStations);
    jest.spyOn(dataService, 'setPreferredStation').mockImplementation();

    configService = TestBed.inject(ConfigurationService);
    userSettingsSignal = signal<IUserSettings>({
      country_code: 'zm',
      location: [undefined, undefined, 'zm', undefined, 'southern', 'choma'],
    } as unknown as IUserSettings);
    (configService as unknown as { userSettings: WritableSignal<IUserSettings> }).userSettings = userSettingsSignal;
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

  it('should toggle view between map and recommendation', () => {
    expect(component.view()).toBe('map');
    component.toggleView();
    expect(component.view()).toBe('recommendation');
    component.toggleView();
    expect(component.view()).toBe('map');
  });

  it('should open AllStationsDialogComponent when openAllStationsDialog is called', () => {
    const openSpy = jest.spyOn(MatDialog.prototype, 'open').mockReturnValue({
      afterClosed: () => of(mockStations[1]),
    } as unknown as MatDialogRef<unknown>);

    component.openAllStationsDialog();

    expect(openSpy).toHaveBeenCalled();
    expect(component.selectedStation()?.id).toBe('batoka');
    openSpy.mockRestore();
  });

  it('should locate user and select closest station when geolocation succeeds', () => {
    const mockGeolocation = {
      getCurrentPosition: jest.fn().mockImplementation((success) => {
        success({
          coords: {
            latitude: -16.82,
            longitude: 27.0,
          },
        });
      }),
    };
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    component.locateUser();

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    expect(component.selectedStation()?.id).toBe('choma');
  });

  it('should include closest station first in nearbyStations with mapNumber and update selection on click', () => {
    component.stationRecommendations.set([
      { station: mockStations[0], distanceKm: 5, isInsideDistrict: true, isRecommended: true, score: -45 },
      { station: mockStations[1], distanceKm: 25, isInsideDistrict: true, isRecommended: false, score: -25 },
    ]);

    expect(component.nearbyStations().length).toBe(2);
    expect(component.nearbyStations()[0].station.id).toBe(mockStations[0].id);
    // sortedAllStations sorts by district ('CHIPATA' then 'CHOMA') then name ('Batoka', 'Choma')
    expect(component.nearbyStations()[0].mapNumber).toBe(3);
    expect(component.nearbyStations()[1].mapNumber).toBe(2);

    // Initial selectedStation
    component.selectedStation.set(mockStations[0]);
    expect(component.displayedStation()?.station.id).toBe(mockStations[0].id);

    // Switch to alternate station
    component.selectAlternateStation(component.nearbyStations()[1]);
    expect(component.displayedStation()?.station.id).toBe(mockStations[1].id);

    // First entry in nearbyStations remains the closest station for easy switching back
    expect(component.nearbyStations()[0].station.id).toBe(mockStations[0].id);
  });

  it('should populate district and selectedStation when clicking a map marker directly', () => {
    const chipataStation = mockStations[2];
    component.handleMarkerClick({
      latlng: [chipataStation.latitude, chipataStation.longitude],
      data: chipataStation,
      _index: 0,
    });

    expect(component.selectedStation()?.id).toBe('chipata');
    expect(component.selectedDistrict()?.id).toBe('chipata');
    expect(component.selectedLocation()).toEqual([undefined, undefined, 'zm', undefined, 'eastern', 'chipata']);
  });
});
