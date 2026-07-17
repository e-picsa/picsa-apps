import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslationsJSONImportComponent } from './json-import.component';

describe('TranslationsJSONImportComponent', () => {
  let component: TranslationsJSONImportComponent;
  let fixture: ComponentFixture<TranslationsJSONImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslationsJSONImportComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TranslationsJSONImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
