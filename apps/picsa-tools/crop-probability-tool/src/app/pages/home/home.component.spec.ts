import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components';
import { ConfigurationService } from '@picsa/configuration/src';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PrintProvider } from '@picsa/shared/services/native/print';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let componentsService: PicsaCommonComponentsService;
  let configService: ConfigurationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        importProvidersFrom(PicsaTranslateModule.forRoot()),
        { provide: PrintProvider, useValue: { shareHtmlDom: jest.fn() } },
      ],
    }).compileComponents();

    configService = TestBed.inject(ConfigurationService);
    componentsService = TestBed.inject(PicsaCommonComponentsService);
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should patch header with center and end portals and clear on destroy', () => {
    expect(componentsService.headerOptions().cdkPortalCenter).toBeDefined();
    expect(componentsService.headerOptions().cdkPortalEnd).toBeDefined();

    fixture.destroy();
    expect(componentsService.headerOptions().cdkPortalCenter).toBeUndefined();
    expect(componentsService.headerOptions().cdkPortalEnd).toBeUndefined();
  });

  it('should delegate shareTable to tableComponent.sharePicture when table is ready', () => {
    const mockShare = jest.fn();
    Object.defineProperty(component, 'tableComponent', {
      value: jest.fn().mockReturnValue({ sharePicture: mockShare }),
    });

    component.shareTable();
    expect(mockShare).toHaveBeenCalled();
  });

  it('should resolve tableStationMeta when location is set with parent and sublocation', () => {
    configService.updateUserSettings({
      country_code: 'zw',
      locationsByCountry: { zw: { province: 'manicaland', district: 'chipinge' } },
    });
    expect(component.tableStationMeta()?.id).toBe('manicaland/chipinge');
  });

  it('should not silently fall back to a sibling table when only parent is selected', () => {
    configService.updateUserSettings({
      country_code: 'zw',
      locationsByCountry: { zw: { province: 'manicaland' } },
    });
    expect(component.tableStationMeta()).toBeUndefined();
  });

  it('should resolve tableStationMeta for Zambia multi-tier district', () => {
    configService.updateUserSettings({
      country_code: 'zm',
      locationsByCountry: { zm: { province: 'central', district: 'chibombo' } },
    });
    expect(component.tableStationMeta()?.id).toBe('central/chibombo');
  });

  it('should not auto-open overlay when component initializes with existing location', () => {
    configService.updateUserSettings({
      country_code: 'zw',
      locationsByCountry: { zw: { province: 'manicaland', district: 'chipinge' } },
    });
    const preseededFixture = TestBed.createComponent(HomeComponent);
    preseededFixture.detectChanges();
    expect(preseededFixture.componentInstance.locationOverlayOpen()).toBe(false);
  });
});
