import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';

import { IStationCropData } from '../../models';
import { CropProbabilityTableComponent } from './crop-probability-table.component';

describe('CropProbabilityTableComponent', () => {
  let component: CropProbabilityTableComponent;
  let fixture: ComponentFixture<CropProbabilityTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CropProbabilityTableComponent],
      providers: [provideHttpClient(), provideRouter([]), importProvidersFrom(PicsaTranslateModule.forRoot())],
    }).compileComponents();

    fixture = TestBed.createComponent(CropProbabilityTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should group matching requirements and sort table rows by days midpoint', () => {
    fixture.componentRef.setInput('tableMeta', {
      id: 'test',
      label: 'Test Location',
      station_label: 'Test Station',
      seasonProbabilities: [1, 0.5],
      dateHeadings: ['Date 1', 'Date 2'],
    });

    const mockStationData: IStationCropData[] = [
      {
        crop: 'maize',
        data: [
          {
            variety: 'SC600',
            days: '130',
            water: [364],
            probabilities: [0.6, 0.2],
          },
          {
            variety: 'PHB 30 G 19',
            days: '135',
            water: [364],
            probabilities: [0.6, 0.2],
          },
          {
            variety: 'SC403',
            days: '110',
            water: [308],
            probabilities: [1, 0.8],
          },
        ],
      },
    ];

    fixture.componentRef.setInput('stationData', mockStationData);
    fixture.detectChanges();

    const rows = component.dataSource.data;
    expect(rows.length).toBe(2);

    // Row 1 should be early variety (110 days)
    expect(rows[0].variety).toBe('SC403');
    expect(rows[0].days).toBe('110');
    expect(rows[0].cropNameRowspan).toBe(2);

    // Row 2 should be grouped late varieties (130 - 135 days)
    expect(rows[1].variety).toBe('SC600, PHB 30 G 19');
    expect(rows[1].days).toBe('130 - 135');
    expect(rows[1].cropNameRowspan).toBe(0);
  });
});
