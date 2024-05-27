import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslationsImportComponent } from './translations-import.component';

describe('TranslationsImportComponent', () => {
  let component: TranslationsImportComponent;
  let fixture: ComponentFixture<TranslationsImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslationsImportComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TranslationsImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
