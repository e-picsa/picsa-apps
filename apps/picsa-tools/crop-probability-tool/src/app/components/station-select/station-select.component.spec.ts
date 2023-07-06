import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CropProbabilityStationSelectComponent } from './station-select.component';

describe('StationSelectComponent', () => {
  let component: CropProbabilityStationSelectComponent;
  let fixture: ComponentFixture<CropProbabilityStationSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CropProbabilityStationSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CropProbabilityStationSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
