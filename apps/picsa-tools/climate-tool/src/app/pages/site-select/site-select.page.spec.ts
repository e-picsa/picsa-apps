import { ChangeDetectionStrategy, Component, forwardRef, Input, signal, WritableSignal } from '@angular/core';
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
  providers: [{ provide: PicsaMapComponent, useExisting: forwardRef(() => MockPicsaMapComponent) }],
})
class MockPicsaMapComponent {
  @Input() markers: unknown;
  @Input() fitBoundsOnMarkerUpdate?: boolean;
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

  it('should clear selectedDistrict when location is incomplete (only province selected)', () => {
    component.selectedLocation.set([undefined, undefined, 'zm', undefined, 'southern', undefined]);
    expect(component.selectedDistrict()).toBeUndefined();
  });

  it('should update location and settings when handleLocationChanged is called with complete location', () => {
    const newLocation = [undefined, undefined, 'zm', undefined, 'southern', 'monze'];

    component.handleLocationChanged(newLocation);

    expect(component.selectedLocation()).toEqual(newLocation);
    expect(configService.updateUserSettings).toHaveBeenCalledWith({ location: newLocation });
  });

  it('should persist incomplete location to user settings when sublocation not present', () => {
    const partialLocation = [undefined, undefined, 'zm', undefined, 'southern', undefined];
    jest.clearAllMocks();

    component.handleLocationChanged(partialLocation);

    expect(component.selectedLocation()).toEqual(partialLocation);
    expect(configService.updateUserSettings).toHaveBeenCalledWith({ location: partialLocation });
  });

  it('should set preferred station and navigate when confirmAndNavigate is called', () => {
    const initialLocation = component.selectedLocation();
    jest.clearAllMocks();
    const targetStation = mockStations[2];
    component.confirmAndNavigate(targetStation);

    expect(dataService.setPreferredStation).toHaveBeenCalledWith('chipata');
    expect(router.navigate).toHaveBeenCalledWith(['./', 'chipata'], expect.anything());
    expect(component.selectedLocation()).toEqual(initialLocation);
    expect(configService.updateUserSettings).not.toHaveBeenCalled();
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

  it('should update selectedStation but maintain selectedLocation when clicking a map marker directly', () => {
    const initialLocation = component.selectedLocation();
    jest.clearAllMocks();
    const chipataStation = mockStations[2];
    component.handleMarkerClick({
      latlng: [chipataStation.latitude, chipataStation.longitude],
      data: chipataStation,
      _index: 0,
    });

    expect(component.selectedStation()?.id).toBe('chipata');
    expect(component.selectedDistrict()?.id).toBe('choma');
    expect(component.selectedLocation()).toEqual(initialLocation);
    expect(configService.updateUserSettings).not.toHaveBeenCalled();
    expect(component.displayedStation()?.station.id).toBe('chipata');
    expect(component.displayedStation()?.isInsideLocation).toBe(false);
  });

  it('should update selectedStation but maintain selectedLocation when selecting a station from all stations dialog', () => {
    const initialLocation = component.selectedLocation();
    jest.clearAllMocks();
    const chipataStation = mockStations[2];
    component.handleRowClick(chipataStation);

    expect(component.selectedStation()?.id).toBe('chipata');
    expect(component.selectedLocation()).toEqual(initialLocation);
    expect(configService.updateUserSettings).not.toHaveBeenCalled();
  });

  it('should zoom map to parent location bounds and outline feature when parent location is selected ahead of sublocation', async () => {
    component.mapReady.set(true);
    const partialLocation = [undefined, undefined, 'zm', undefined, 'central', undefined];
    component.handleLocationChanged(partialLocation);
    fixture.detectChanges();

    // Allow async getLocationCenterAndBoundary to resolve and effect to execute
    await new Promise((resolve) => setTimeout(resolve, 50));
    fixture.detectChanges();

    const map = component.picsaMap();
    if (map) {
      expect(map.addGeoJsonLayer).toHaveBeenCalledWith(
        'selected-district-boundary',
        expect.anything(),
        expect.objectContaining({ lineWidth: 2, lineOpacity: 0.6 }),
      );
      expect(map.fitBounds).toHaveBeenCalled();
    }
  });

  it('should zoom map to country bounds once when country known but no province/district selected', async () => {
    jest.clearAllMocks();
    component.mapReady.set(true);
    component.handleLocationChanged([undefined, undefined, 'zm', undefined, undefined, undefined]);
    fixture.detectChanges();

    // Allow async getCountryBounds (topojson parse) to resolve and effect to execute
    const map = component.picsaMap();
    for (let i = 0; i < 40 && (map?.fitBounds as jest.Mock).mock.calls.length === 0; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    fixture.detectChanges();

    expect(map?.fitBounds).toHaveBeenCalledTimes(1);
    expect(map?.fitBounds).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.arrayContaining([expect.any(Number), expect.any(Number)]),
        expect.arrayContaining([expect.any(Number), expect.any(Number)]),
      ]),
      expect.objectContaining({ maxZoom: 7 }),
    );
  });

  it('should fit location and station bounds when clicking an out-of-location map marker', async () => {
    component.mapReady.set(true);
    fixture.detectChanges();
    for (let i = 0; i < 40 && !component.locationCenterResult(); i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    fixture.detectChanges();
    expect(component.locationCenterResult()).toBeDefined();

    jest.clearAllMocks();
    const chipataStation = mockStations[2];
    component.handleMarkerClick({
      latlng: [chipataStation.latitude, chipataStation.longitude],
      data: chipataStation,
      _index: 0,
    });

    const map = component.picsaMap();
    // Single camera move covering both district boundary and station
    expect(map?.fitBounds).toHaveBeenCalledTimes(1);
    const [[minLng, minLat], [maxLng, maxLat]] = (map?.fitBounds as jest.Mock).mock.calls[0][0];
    expect(minLng).toBeLessThan(28);
    expect(maxLng).toBeGreaterThanOrEqual(32.58);
    expect(minLat).toBeLessThan(-16);
    expect(maxLat).toBeGreaterThanOrEqual(-13.55);
    expect(map?.setActiveMarker).toHaveBeenCalledWith(expect.objectContaining({ data: chipataStation }), false, false);
  });

  it('should fit location and station bounds without flyTo jump when selecting an out-of-location station from the list', async () => {
    component.mapReady.set(true);
    fixture.detectChanges();
    for (let i = 0; i < 40 && !component.locationCenterResult(); i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    fixture.detectChanges();
    expect(component.locationCenterResult()).toBeDefined();

    jest.clearAllMocks();
    const chipataStation = mockStations[2];
    expect(component.selectedStation()?.id).not.toBe('chipata');
    component.handleRowClick(chipataStation);

    const map = component.picsaMap();
    expect(component.selectedStation()?.id).toBe('chipata');
    expect(map?.fitBounds).toHaveBeenCalledTimes(1);
    expect(map?.setActiveMarker).toHaveBeenCalledWith(expect.objectContaining({ data: chipataStation }), false, false);
  });

  it('should not zoom map to country bounds when a deeper location is selected', async () => {
    jest.clearAllMocks();
    component.mapReady.set(true);
    // Complete location already set from settings; fallback must stay out of the way
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 100));
    fixture.detectChanges();

    const map = component.picsaMap();
    const fallbackCalls = (map?.fitBounds as jest.Mock).mock.calls.filter(
      ([, options]) => (options as { maxZoom?: number })?.maxZoom === 7,
    );
    expect(fallbackCalls).toHaveLength(0);
  });
});
