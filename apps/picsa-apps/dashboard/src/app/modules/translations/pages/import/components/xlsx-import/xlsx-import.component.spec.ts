import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslationsXLSXImportComponent } from './xlsx-import.component';

describe('TranslationsXLSXImportComponent', () => {
  let component: TranslationsXLSXImportComponent;
  let fixture: ComponentFixture<TranslationsXLSXImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslationsXLSXImportComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TranslationsXLSXImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
