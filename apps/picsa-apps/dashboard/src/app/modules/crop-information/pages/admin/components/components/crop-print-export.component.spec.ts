import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeploymentDashboardService } from '../../../../../deployment/deployment.service';
import { CropInformationService } from '../../../../services';
import { CropProbabilityPrintService } from '../../../../services/crop-probability-print.service';
import { CropPrintExportComponent } from './crop-print-export.component';

describe('CropPrintExportComponent', () => {
  let component: CropPrintExportComponent;
  let fixture: ComponentFixture<CropPrintExportComponent>;

  const mockPrintService = {
    exportPrint: jest.fn().mockResolvedValue({ files: 2, skipped: 0, failed: [] }),
    computeLocationTables: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CropPrintExportComponent],
      providers: [
        {
          provide: DeploymentDashboardService,
          useValue: {
            activeDeploymentCountry: signal('zw'),
            activeDeployment: signal({ country_code: 'zw' }),
          },
        },
        {
          provide: CropInformationService,
          useValue: {
            ready: jest.fn().mockResolvedValue(undefined),
            downscaledData: signal([
              {
                location_id: 'buhera',
                water_requirements: { maize: { 'SC 403': 400, 'SC 719': 450 }, beans: { Kholophethe: 300 } },
              },
              { location_id: 'mutare', water_requirements: { maize: { 'SC 403': 400 } } },
            ]),
            stationData: signal([]),
            cropData: signal([
              { crop: 'maize', variety: 'SC 403' },
              { crop: 'maize', variety: 'SC 719' },
              { crop: 'beans', variety: 'Kholophethe' },
            ]),
          },
        },
        { provide: CropProbabilityPrintService, useValue: mockPrintService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CropPrintExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should disable export with no selections', () => {
    component.selectedLocationIds.set([]);
    component.selectedLanguageCodes.set(['global_en']);
    expect(component.canExport()).toBe(false);
  });

  it('should bulk export word docs with selected locations and languages', async () => {
    component.selectedLocationIds.set(['buhera']);
    component.selectedLanguageCodes.set(['global_en', 'zw_sn']);
    component.selectedCropIds.set(['maize']);
    fixture.detectChanges();
    await component.exportBulk('docx');
    expect(mockPrintService.exportPrint).toHaveBeenCalledWith(
      expect.objectContaining({
        locationIds: ['buhera'],
        languageCodes: ['global_en', 'zw_sn'],
        cropFamilies: ['maize'],
        format: 'docx',
      }),
    );
  });

  it('should bulk export pdfs with selected locations and languages', async () => {
    component.selectedLocationIds.set(['buhera']);
    component.selectedLanguageCodes.set(['global_en']);
    fixture.detectChanges();
    await component.exportBulk('pdf');
    expect(mockPrintService.exportPrint).toHaveBeenCalledWith(
      expect.objectContaining({ locationIds: ['buhera'], format: 'pdf' }),
    );
  });

  it('should disable export with no crops selected', () => {
    component.selectedLocationIds.set(['buhera']);
    component.selectedCropIds.set([]);
    expect(component.canExport()).toBe(false);
  });

  it('should list all crop families with variety counts by default', () => {
    expect(component.selectedCropIds().length).toBe(2);
    const maize = component.cropFamilies().find((f) => f.id === 'maize');
    expect(maize?.varietyCount).toBe(2);
  });

  it('should show max rows per family across selected locations', () => {
    component.selectedLocationIds.set(['buhera', 'mutare']);
    expect(component.cropCountLabel('maize')).toBe('(2)');
    expect(component.cropCountLabel('beans')).toBe('(1)');
  });

  it('should match single location values when only one location selected', () => {
    component.selectedLocationIds.set(['mutare']);
    expect(component.cropCountLabel('maize')).toBe('(1)');
    expect(component.cropCountLabel('beans')).toBe('(0)');
  });

  it('should hide families with no rows in the selected locations', () => {
    component.selectedLocationIds.set(['mutare']);
    expect(component.visibleCropFamilies().map((f) => f.id)).toEqual(['maize']);
    // beans is still selected but hidden, so excluded from the counter
    expect(component.selectedVisibleCropCount()).toBe(1);
  });

  it('should select only visible families on select all', () => {
    component.selectedLocationIds.set(['mutare']);
    component.toggleAllCrops(true);
    expect(component.selectedCropIds()).toEqual(['maize']);
  });

  it('should toggle all districts within a group', () => {
    component.toggleGroup(
      { id: 'manicaland', label: 'Manicaland', districts: [{ id: 'buhera', label: 'Buhera', available: true }] },
      true,
    );
    expect(component.selectedLocationIds()).toContain('buhera');
  });

  it('should not export a single location when no crops selected', async () => {
    component.selectedLanguageCodes.set(['global_en']);
    component.selectedCropIds.set([]);
    (mockPrintService.exportPrint as jest.Mock).mockClear();
    fixture.detectChanges();
    await component.exportSingle('buhera', 'pdf');
    expect(mockPrintService.exportPrint).not.toHaveBeenCalled();
  });

  it('should not export a single location with no rows for the selected crops', async () => {
    component.selectedCropIds.set(['beans']);
    (mockPrintService.exportPrint as jest.Mock).mockClear();
    await component.exportSingle('mutare', 'pdf');
    expect(mockPrintService.exportPrint).not.toHaveBeenCalled();
  });

  it('should export a single location directly', async () => {
    component.selectedLanguageCodes.set(['global_en']);
    fixture.detectChanges();
    await component.exportSingle('buhera', 'pdf');
    expect(mockPrintService.exportPrint).toHaveBeenCalledWith(
      expect.objectContaining({ locationIds: ['buhera'], format: 'pdf' }),
    );
  });

  it('should use the currently selected crop filter for single exports', async () => {
    component.selectedLanguageCodes.set(['global_en']);
    component.selectedCropIds.set(['beans']);
    (mockPrintService.exportPrint as jest.Mock).mockClear();
    fixture.detectChanges();
    await component.exportSingle('buhera', 'docx');
    expect(mockPrintService.exportPrint).toHaveBeenCalledWith(
      expect.objectContaining({ locationIds: ['buhera'], cropFamilies: ['beans'], format: 'docx' }),
    );
  });
});
