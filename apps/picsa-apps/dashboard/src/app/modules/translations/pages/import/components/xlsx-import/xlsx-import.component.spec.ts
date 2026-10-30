import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslationDashboardService } from '../../../../translations.service';
import { TranslationsXLSXImportComponent } from './xlsx-import.component';

describe('TranslationsXLSXImportComponent', () => {
  let component: TranslationsXLSXImportComponent;
  let fixture: ComponentFixture<TranslationsXLSXImportComponent>;
  let mockTranslationService: { exportXlsx: jest.Mock };

  beforeEach(async () => {
    mockTranslationService = {
      exportXlsx: jest.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [TranslationsXLSXImportComponent],
      providers: [{ provide: TranslationDashboardService, useValue: mockTranslationService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TranslationsXLSXImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
