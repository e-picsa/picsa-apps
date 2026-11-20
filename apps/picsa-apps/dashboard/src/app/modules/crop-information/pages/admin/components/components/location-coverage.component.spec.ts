import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import type { CountryCodeLegacy } from '@picsa/server-types';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

import { DeploymentDashboardService } from '../../../../../deployment/deployment.service';
import { CropInformationService } from '../../../../services';
import { CropLocationCoverageComponent } from './location-coverage.component';

describe('CropLocationCoverageComponent', () => {
  let component: CropLocationCoverageComponent;
  let fixture: ComponentFixture<CropLocationCoverageComponent>;
  let activeCountry: ReturnType<typeof signal<CountryCodeLegacy | undefined>>;

  beforeEach(async () => {
    activeCountry = signal<CountryCodeLegacy | undefined>('zw');

    await TestBed.configureTestingModule({
      imports: [CropLocationCoverageComponent, NoopAnimationsModule],
      providers: [
        {
          provide: DeploymentDashboardService,
          useValue: {
            activeDeploymentCountry: activeCountry,
          },
        },
        {
          provide: CropInformationService,
          useValue: {
            stationData: signal([]),
            stations: signal([]),
            downscaledData: signal([]),
          },
        },
        { provide: PicsaNotificationService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CropLocationCoverageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('labels parent and deepest columns dynamically and orders parent first for multi-layer countries (zw, zm)', () => {
    activeCountry.set('zw');
    const zwOptions = component.tableOptions();
    expect(zwOptions.displayColumns?.slice(0, 2)).toEqual(['parent_location', 'location_label']);
    expect(zwOptions.formatHeader?.('parent_location')).toBe('Province');
    expect(zwOptions.formatHeader?.('location_label')).toBe('District');

    activeCountry.set('zm');
    const zmOptions = component.tableOptions();
    expect(zmOptions.displayColumns?.slice(0, 2)).toEqual(['parent_location', 'location_label']);
    expect(zmOptions.formatHeader?.('parent_location')).toBe('Province');
    expect(zmOptions.formatHeader?.('location_label')).toBe('District');
  });

  it('omits parent_location and labels location column dynamically for single-layer countries (mw)', () => {
    activeCountry.set('mw');
    const mwOptions = component.tableOptions();
    expect(mwOptions.displayColumns).not.toContain('parent_location');
    expect(mwOptions.displayColumns?.[0]).toBe('location_label');
    expect(mwOptions.formatHeader?.('location_label')).toBe('District');
  });
});
