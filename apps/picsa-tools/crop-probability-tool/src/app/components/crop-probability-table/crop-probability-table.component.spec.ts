import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DataIconRegistry } from '@picsa/data/iconRegistry';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PrintProvider } from '@picsa/shared/services/native/print';

import { IStationCropData } from '../../models';
import { CropProbabilityTableComponent } from './crop-probability-table.component';

describe('CropProbabilityTableComponent', () => {
  let component: CropProbabilityTableComponent;
  let fixture: ComponentFixture<CropProbabilityTableComponent>;
  let mockPrintProvider: { shareHtmlDom: jest.Mock };

  beforeEach(async () => {
    mockPrintProvider = {
      shareHtmlDom: jest.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [CropProbabilityTableComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        importProvidersFrom(PicsaTranslateModule.forRoot()),
        { provide: PrintProvider, useValue: mockPrintProvider },
        { provide: DataIconRegistry, useValue: { registerMatIcons: jest.fn() } },
      ],
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

  describe('sharePicture', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('tableMeta', {
        id: 'test-kasungu',
        label: 'Kasungu',
        station_label: 'KASUNGU MET STATION',
        seasonProbabilities: [0.5],
        dateHeadings: ['15-Nov'],
      });
      fixture.componentRef.setInput('stationData', [
        {
          crop: 'maize',
          data: [
            {
              variety: 'SC403',
              days: '110',
              water: [300],
              probabilities: [0.8],
            },
          ],
        },
      ]);
      fixture.detectChanges();
    });

    it('should call printProvider.shareHtmlDom with selector and filename without crop when all crops shown', async () => {
      component.selectedCropName.set('');
      const sharePromise = component.sharePicture();

      expect(component.shareDisabled()).toBe(true);
      expect(component.shareStatus()).toBe('Preparing image....');

      await sharePromise;

      expect(mockPrintProvider.shareHtmlDom).toHaveBeenCalledWith(
        '#cropProbabilityTable',
        'Crop Probability - Kasungu',
      );
      expect(component.shareDisabled()).toBe(false);
      expect(component.shareStatus()).toBe('Share');
    });

    it('should include crop name in filename when crop is filtered', async () => {
      component.selectedCropName.set('maize');
      await component.sharePicture();

      expect(mockPrintProvider.shareHtmlDom).toHaveBeenCalledWith(
        '#cropProbabilityTable',
        'Crop Probability - Kasungu - Maize',
      );
    });

    it('should handle sharing errors gracefully', async () => {
      mockPrintProvider.shareHtmlDom.mockRejectedValueOnce(new Error('Export failed'));
      await component.sharePicture();

      expect(component.shareDisabled()).toBe(false);
      expect(component.shareStatus()).toBe('Export failed');
    });
  });
});
