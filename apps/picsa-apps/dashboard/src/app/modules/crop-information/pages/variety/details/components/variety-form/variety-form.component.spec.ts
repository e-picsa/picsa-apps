import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeploymentDashboardService } from '../../../../../../deployment/deployment.service';
import { DashboardCropVarietyFormComponent } from './variety-form.component';

describe('VarietyFormComponent', () => {
  let component: DashboardCropVarietyFormComponent;
  let fixture: ComponentFixture<DashboardCropVarietyFormComponent>;
  let mockDeployment: any;

  beforeEach(async () => {
    mockDeployment = {
      activeDeployment: signal({ country_code: 'zm' }),
      activeDeploymentCountry: signal('zm'),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardCropVarietyFormComponent],
      providers: [{ provide: DeploymentDashboardService, useValue: mockDeployment }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardCropVarietyFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and default country_code to active deployment country', () => {
    expect(component).toBeTruthy();
    expect(component.value.country_code).toBe('zm');
  });

  it('should include active deployment country_code when getting form value', () => {
    mockDeployment.activeDeployment.set({ country_code: 'mw' });
    mockDeployment.activeDeploymentCountry.set('mw');
    fixture.detectChanges();

    component.form.patchValue({
      crop: 'beans',
      variety: 'KWARE',
      maturity_period: 'early',
      days_lower: 75,
      days_upper: 75,
    });

    const val = component.value;
    expect(val.country_code).toBe('mw');
    expect(val.crop).toBe('beans');
    expect(val.variety).toBe('KWARE');
  });
});
