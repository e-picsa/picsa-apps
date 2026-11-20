import { TestBed } from '@angular/core/testing';

import { CropPrintPdfService } from './crop-print-pdf.service';

describe('CropPrintPdfService', () => {
  let service: CropPrintPdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CropPrintPdfService] });
    service = TestBed.inject(CropPrintPdfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
