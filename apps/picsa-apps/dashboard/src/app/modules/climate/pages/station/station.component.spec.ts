import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClimateStationPageComponent } from './station.component';

describe('ClimateStationPageComponent', () => {
  let component: ClimateStationPageComponent;
  let fixture: ComponentFixture<ClimateStationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClimateStationPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClimateStationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
