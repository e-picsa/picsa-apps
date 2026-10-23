import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormLocationSelectComponent } from './location-select.component';

describe('FormLocationSelectComponent', () => {
  let component: FormLocationSelectComponent;
  let fixture: ComponentFixture<FormLocationSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormLocationSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormLocationSelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('countryCode', 'zw');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('auto-selects the single district when switching from another province/district to Harare or Bulawayo', () => {
    const emitted: (string | undefined)[][] = [];
    component.valueChanged.subscribe((v) => emitted.push(v));

    // 1. Select Manicaland -> Buhera
    component.admin4Selected.set('manicaland');
    fixture.detectChanges();
    expect(component.admin5Options().length).toBeGreaterThan(1);

    component.admin5Selected.set('buhera');
    fixture.detectChanges();
    expect(emitted[emitted.length - 1]).toEqual([undefined, undefined, 'zw', undefined, 'manicaland', 'buhera']);

    // 2. Switch to Harare Province (which only has 1 district: 'harare')
    component.admin4Selected.set('harare_province');
    fixture.detectChanges();

    expect(component.admin5Selected()).toBe('harare');
    expect(component.isValid()).toBe(true);
    expect(emitted[emitted.length - 1]).toEqual([undefined, undefined, 'zw', undefined, 'harare_province', 'harare']);
  });

  it('clears previous district and emits incomplete state when switching to a multi-district province', () => {
    const emitted: (string | undefined)[][] = [];
    component.valueChanged.subscribe((v) => emitted.push(v));

    // 1. Start with a valid selection (Manicaland -> Buhera)
    fixture.componentRef.setInput('value', [undefined, undefined, 'zw', undefined, 'manicaland', 'buhera']);
    fixture.detectChanges();
    expect(component.isValid()).toBe(true);
    expect(emitted[emitted.length - 1]).toEqual([undefined, undefined, 'zw', undefined, 'manicaland', 'buhera']);

    // 2. Switch province to Masvingo (7 districts)
    component.admin4Selected.set('masvingo');
    fixture.detectChanges();

    expect(component.admin5Selected()).toBeUndefined();
    expect(component.isValid()).toBe(false);
    // Should emit the cleared district state so parent clears stale district/station
    expect(emitted[emitted.length - 1]).toEqual([undefined, undefined, 'zw', undefined, 'masvingo', undefined]);

    // 3. Selecting a district in Masvingo emits the new complete location
    component.admin5Selected.set('bikita');
    fixture.detectChanges();
    expect(component.isValid()).toBe(true);
    expect(emitted[emitted.length - 1]).toEqual([undefined, undefined, 'zw', undefined, 'masvingo', 'bikita']);
  });
});
