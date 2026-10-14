import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ClimateService } from '../../../../climate.service';
import { IStationRow } from '../../../../types';
import { StationDetailsDialogComponent } from './station-details-dialog.component';

describe('StationDetailsDialogComponent', () => {
  let component: StationDetailsDialogComponent;
  let fixture: ComponentFixture<StationDetailsDialogComponent>;
  let mockClimateService: any;
  let mockDialogRef: any;

  const mockStation: IStationRow = {
    id: 'station-1',
    station_id: 'station-1',
    station_name: 'Test Station',
    country_code: 'mw',
  };

  beforeEach(async () => {
    mockClimateService = {
      getStationData: jest.fn().mockResolvedValue({
        data: {
          id: 'station-1',
          station_id: 'station-1',
          annual_rainfall_summaries: [],
          crop_probability_data: [],
        },
      }),
    };

    mockDialogRef = {
      close: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [StationDetailsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: ClimateService, useValue: mockClimateService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { station: mockStation } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StationDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load station data', async () => {
    expect(component).toBeTruthy();
    await fixture.whenStable();
    expect(mockClimateService.getStationData).toHaveBeenCalledWith('station-1');
    expect(component.stationData()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });
});
