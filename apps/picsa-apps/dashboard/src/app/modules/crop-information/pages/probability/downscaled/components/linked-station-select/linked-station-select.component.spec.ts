import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkedStationSelectComponent } from './linked-station-select.component';

describe('LinkedStationSelectComponent', () => {
  let component: LinkedStationSelectComponent;
  let fixture: ComponentFixture<LinkedStationSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkedStationSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkedStationSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
