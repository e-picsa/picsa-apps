import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PicsaTranslateModule } from '@picsa/i18n';

import { DeploymentDashboardService } from '../../deployment/deployment.service';
import { CropInformationService } from './crop-information.service';
import { CropPrintPdfService } from './crop-print-pdf.service';
import { CropProbabilityDocxService } from './crop-probability-docx.service';
import { CropProbabilityPrintService } from './crop-probability-print.service';

describe('CropProbabilityPrintService', () => {
  let service: CropProbabilityPrintService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PicsaTranslateModule.forRoot()],
      providers: [
        CropProbabilityPrintService,
        CropProbabilityDocxService,
        CropPrintPdfService,
        { provide: CropInformationService, useValue: { ready: jest.fn(), cropData: signal([]) } },
        { provide: DeploymentDashboardService, useValue: { activeDeployment: signal(null) } },
      ],
    });
    service = TestBed.inject(CropProbabilityPrintService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should throw when no active deployment', async () => {
    await expect(service.computeLocationTables(['a'])).rejects.toThrow('No active deployment');
  });
});
