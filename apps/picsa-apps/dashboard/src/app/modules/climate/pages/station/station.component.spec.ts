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
  @Input() markers: any;
}

describe('ClimateStationPageComponent', () => {
  let component: ClimateStationPageComponent;
  let fixture: ComponentFixture<ClimateStationPageComponent>;
  let mockClimateService: any;

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
      stationQcMap: jest.fn().mockReturnValue({
        'mw/salima': {
          passed: true,
          failures: [],
          reasons: [],
        },
      }),
      apiCountryCode: 'mw',
    };

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

  it('should configure table options with qc_status column and header', () => {
    expect(component.tableOptions.displayColumns).toContain('qc_status');
    expect(component.tableOptions.formatHeader?.('qc_status')).toBe('QC');
  });

  it('should compute tableData with qc_passed and qc_reasons mapped from stationQcMap', () => {
    const data = component.tableData();
    expect(data.length).toBe(1);
    expect(data[0].station_id).toBe('salima');
    expect(data[0].qc_passed).toBe(true);
    expect(data[0].qc_reasons).toEqual([]);
  });
});
