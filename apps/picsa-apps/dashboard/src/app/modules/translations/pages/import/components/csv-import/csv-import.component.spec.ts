import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslationsCSVImportComponent } from './csv-import.component';

describe('CsvImportComponent', () => {
  let component: TranslationsCSVImportComponent;
  let fixture: ComponentFixture<TranslationsCSVImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslationsCSVImportComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TranslationsCSVImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
