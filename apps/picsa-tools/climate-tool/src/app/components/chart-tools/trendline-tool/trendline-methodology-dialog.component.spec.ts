import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { PicsaTranslateModule } from '@picsa/i18n';

import { TrendlineMethodologyDialogComponent } from './trendline-methodology-dialog.component';

describe('TrendlineMethodologyDialogComponent', () => {
  let component: TrendlineMethodologyDialogComponent;
  let fixture: ComponentFixture<TrendlineMethodologyDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendlineMethodologyDialogComponent, PicsaTranslateModule.forRoot()],
      providers: [{ provide: MatDialogRef, useValue: {} }],
    }).compileComponents();

    fixture = TestBed.createComponent(TrendlineMethodologyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
