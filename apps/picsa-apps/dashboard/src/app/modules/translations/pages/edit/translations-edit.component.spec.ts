import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { TranslationDashboardService } from '../../translations.service';
import { TranslationsEditComponent } from './translations-edit.component';

describe('TranslationsEditComponent', () => {
  let component: TranslationsEditComponent;
  let fixture: ComponentFixture<TranslationsEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslationsEditComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            row: { id: 'test-id', text: 'Hello', tool: 'test', context: 'test' },
            locale: 'zm_ny',
          },
        },
        {
          provide: TranslationDashboardService,
          useValue: {
            ready: () => Promise.resolve(),
            updateTranslationById: () => Promise.resolve(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TranslationsEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
