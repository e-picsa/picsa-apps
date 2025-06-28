import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCropWaterRequirementsComponent } from './water-requirements.component';

describe('WaterRequirementsComponent', () => {
  let component: DashboardCropWaterRequirementsComponent;
  let fixture: ComponentFixture<DashboardCropWaterRequirementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCropWaterRequirementsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardCropWaterRequirementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
