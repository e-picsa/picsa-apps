import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import type { CountryCodeLegacy } from '@picsa/server-types';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

import { DashboardAuthService } from '../../../../../../auth/services/auth.service';
import { DeploymentDashboardService } from '../../../../../../deployment/deployment.service';
import { CropInformationService, ICropDataMerged } from '../../../../../services';
import { DashboardCropWaterRequirementsComponent } from './water-requirements.component';

describe('WaterRequirementsComponent', () => {
  let component: DashboardCropWaterRequirementsComponent;
  let fixture: ComponentFixture<DashboardCropWaterRequirementsComponent>;
  let activeDeployment: ReturnType<typeof signal<{ country_code: CountryCodeLegacy } | undefined>>;

  beforeEach(async () => {
    activeDeployment = signal<{ country_code: CountryCodeLegacy } | undefined>({ country_code: 'zw' });

    await TestBed.configureTestingModule({
      imports: [DashboardCropWaterRequirementsComponent, NoopAnimationsModule],
      providers: [
        {
          provide: DeploymentDashboardService,
          useValue: {
            activeDeployment,
            activeDeploymentCountry: () => activeDeployment()?.country_code,
          },
        },
        { provide: CropInformationService, useValue: {} },
        { provide: DashboardAuthService, useValue: { hasRole: () => false } },
        { provide: PicsaNotificationService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardCropWaterRequirementsComponent);
    fixture.componentRef.setInput('data', {
      id: '1',
      crop: 'maize',
      variety: 'SC403',
      downscaled: [],
    } as unknown as ICropDataMerged);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('populates Province and District columns for Zimbabwe (zw)', () => {
    activeDeployment.set({ country_code: 'zw' });
    fixture.componentRef.setInput('data', {
      id: '1',
      crop: 'maize',
      variety: 'SC403',
      downscaled: [
        { location_id: 'bikita', water_requirement: 450 },
        { location_id: 'masvingo', water_requirement: 500 },
      ],
    } as unknown as ICropDataMerged);
    fixture.detectChanges();

    expect(component.tableData()).toEqual([
      {
        Province: 'Masvingo',
        District: 'Bikita',
        location_id: 'bikita',
        water_requirement: 450,
        location_hash: 'zw/masvingo/bikita',
      },
      {
        Province: 'Masvingo',
        District: 'Masvingo',
        location_id: 'masvingo',
        water_requirement: 500,
        location_hash: 'zw/masvingo/masvingo',
      },
    ]);
  });

  it('populates single District column for Malawi (mw)', () => {
    activeDeployment.set({ country_code: 'mw' });
    fixture.componentRef.setInput('data', {
      id: '1',
      crop: 'maize',
      variety: 'SC403',
      downscaled: [{ location_id: 'lilongwe', water_requirement: 400 }],
    } as unknown as ICropDataMerged);
    fixture.detectChanges();

    expect(component.tableData()).toEqual([
      {
        District: 'Lilongwe',
        location_id: 'lilongwe',
        water_requirement: 400,
        location_hash: 'mw/lilongwe',
      },
    ]);
  });

  it('falls back gracefully for unknown downscaled location ids', () => {
    activeDeployment.set({ country_code: 'zm' });
    fixture.componentRef.setInput('data', {
      id: '1',
      crop: 'maize',
      variety: 'SC403',
      downscaled: [{ location_id: 'unknown_district', water_requirement: 420 }],
    } as unknown as ICropDataMerged);
    fixture.detectChanges();

    expect(component.tableData()).toEqual([
      {
        Province: '',
        District: 'Unknown District',
        location_id: 'unknown_district',
        water_requirement: 420,
        location_hash: 'zm//unknown_district',
      },
    ]);
  });
});
