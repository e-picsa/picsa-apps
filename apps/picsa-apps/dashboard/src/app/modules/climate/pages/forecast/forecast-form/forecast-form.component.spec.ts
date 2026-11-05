import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ForecastFormComponent } from './forecast-form.component';

describe('ForecastFormComponent', () => {
  let component: ForecastFormComponent;
  let fixture: ComponentFixture<ForecastFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForecastFormComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { country_code: 'zm' } },
        { provide: MatDialogRef, useValue: { close: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForecastFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults to seasonal without a location field', () => {
    expect(component.forecastType()).toBe('seasonal');
    expect(component.form.controls.forecast_type.value).toBe('seasonal');
    expect(fixture.nativeElement.querySelectorAll('mat-select').length).toBe(1);
  });

  it('requires a location when downscaled is picked', () => {
    component.forecastType.set('downscaled');
    fixture.detectChanges();
    expect(component.form.controls.forecast_type.value).toBe('downscaled');
    expect(component.form.controls.downscaled_location.hasValidator(Validators.required)).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('mat-select').length).toBe(2);
  });
});
