import { TestBed } from '@angular/core/testing';
import { PicsaTranslateModule } from '@picsa/i18n';
import { Document, Packer } from 'docx';
import download from 'downloadjs';

import { CropProbabilityDocxService } from './crop-probability-docx.service';

jest.mock('downloadjs', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('CropProbabilityDocxService', () => {
  let service: CropProbabilityDocxService;

  const mockMeta = {
    id: 'test-id',
    label: 'Dedza North',
    station_label: 'DEDZA MET',
    seasonProbabilities: [0.7, 0.9, 1.0, 0.5],
    dateHeadings: ['15-Nov', '01-Dec', '15-Dec', '01-Jan'],
  };

  const mockStationData = [
    {
      crop: 'maize' as const,
      data: [
        {
          variety: 'SC 403',
          days: '90-100',
          water: [350, 450],
          probabilities: [0.8, 0.9, 0.9, 0.6],
        },
        {
          variety: 'SC 719',
          days: '130-140',
          water: [450, 600],
          probabilities: [0.6, 0.7, 0.8, 0.4],
        },
      ],
    },
    {
      crop: 'beans' as const,
      data: [
        {
          variety: 'Kholophethe',
          days: '70-85',
          water: [250, 350],
          probabilities: [0.9, 0.9, 0.8, 0.5],
        },
      ],
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PicsaTranslateModule.forRoot()],
      providers: [CropProbabilityDocxService],
    });
    service = TestBed.inject(CropProbabilityDocxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should format probability values correctly', () => {
    expect(service.formatProbability(0.7)).toBe('7/10');
    expect(service.formatProbability(0.94)).toBe('9/10');
    expect(service.formatProbability('8/10')).toBe('8/10');
    expect(service.formatProbability(null)).toBe('');
    expect(service.formatProbability(undefined)).toBe('');
    expect(service.formatProbability('invalid')).toBe('');
  });

  it('should build a valid Document structure for 4 date columns', async () => {
    const doc = service.buildDocxDocument(mockStationData, mockMeta, 'Dedza North');
    expect(doc).toBeInstanceOf(Document);

    const buffer = await Packer.toBuffer(doc);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should build a valid Document structure for 6 date columns', async () => {
    const meta6Cols = {
      ...mockMeta,
      dateHeadings: ['01-Nov', '15-Nov', '01-Dec', '15-Dec', '01-Jan', '15-Jan'],
      seasonProbabilities: [0.5, 0.7, 0.8, 0.9, 0.8, 0.4],
    };

    const doc = service.buildDocxDocument(mockStationData, meta6Cols, 'Salima');
    expect(doc).toBeInstanceOf(Document);

    const buffer = await Packer.toBuffer(doc);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should export docx and include default language label in filename', async () => {
    await service.exportDocx({
      stationData: mockStationData,
      tableMeta: mockMeta,
      locationName: 'Dedza North',
    });

    expect(download).toHaveBeenCalledWith(
      expect.any(Blob),
      'Dedza North - Crop Probabilities - English.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });

  it('should export docx and include localized language label in filename', async () => {
    await service.exportDocx({
      stationData: mockStationData,
      tableMeta: mockMeta,
      locationName: 'Chikwawa',
      languageCode: 'zm_ny',
    });

    expect(download).toHaveBeenCalledWith(
      expect.any(Blob),
      'Chikwawa - Crop Probabilities - Nyanja.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });
});
