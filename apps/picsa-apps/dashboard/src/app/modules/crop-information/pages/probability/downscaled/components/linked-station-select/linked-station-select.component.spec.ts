import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CropLinkedStationSelectComponent } from './linked-station-select.component';

describe('CropLinkedStationSelectComponent', () => {
  let component: CropLinkedStationSelectComponent;
  let fixture: ComponentFixture<CropLinkedStationSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CropLinkedStationSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CropLinkedStationSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
