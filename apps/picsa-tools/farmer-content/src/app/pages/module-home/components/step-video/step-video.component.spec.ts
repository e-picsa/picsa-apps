import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmerStepVideoComponent } from './step-video.component';

describe('FarmerStepVideoComponent', () => {
  let component: FarmerStepVideoComponent;
  let fixture: ComponentFixture<FarmerStepVideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmerStepVideoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FarmerStepVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
