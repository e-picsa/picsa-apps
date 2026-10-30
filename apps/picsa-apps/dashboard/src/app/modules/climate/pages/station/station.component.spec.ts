import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PicsaMapComponent } from '@picsa/shared/features/map/map';

import { ClimateService } from '../../climate.service';
import { ClimateStationPageComponent } from './station.component';

/* eslint-disable @angular-eslint/prefer-on-push-component-change-detection, @angular-eslint/component-selector */
@Component({
  selector: 'picsa-map',
  changeDetection: 0,
  template: '',
  standalone: true,
})
class MockMapComponent {
  @Input() markers: unknown;
}

describe('ClimateStationPageComponent', () => {
  let component: ClimateStationPageComponent;
  let fixture: ComponentFixture<ClimateStationPageComponent>;
  let mockClimateService: Partial<ClimateService>;

  beforeEach(async () => {
    mockClimateService = {
      stations: jest.fn().mockReturnValue([
        {
          id: 'mw/salima',
          station_id: 'salima',
          station_name: 'Salima',
          district: 'Salima',
          latitude: -13.78,
          longitude: 34.45,
        },
      ]),
      apiCountryCode: 'mw',
    } as unknown as ClimateService;

    await TestBed.configureTestingModule({
      imports: [ClimateStationPageComponent],
      providers: [provideRouter([]), { provide: ClimateService, useValue: mockClimateService }],
    })
      .overrideComponent(ClimateStationPageComponent, {
        remove: { imports: [PicsaMapComponent] },
        add: { imports: [MockMapComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ClimateStationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
