import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCropVarietyFormComponent } from './variety-form.component';

describe('VarietyFormComponent', () => {
  let component: DashboardCropVarietyFormComponent;
  let fixture: ComponentFixture<DashboardCropVarietyFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCropVarietyFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardCropVarietyFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
