import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { ILocationSelection } from '@picsa/data/geoLocation';
import { PicsaTranslateModule } from '@picsa/i18n';

import { FormLocationOverlayComponent } from './location-overlay.component';

describe('FormLocationOverlayComponent', () => {
  let component: FormLocationOverlayComponent;
  let fixture: ComponentFixture<FormLocationOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormLocationOverlayComponent, PicsaTranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(FormLocationOverlayComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('countryCode', 'zm');
  });

  it('renders nothing when closed', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.fixed')).toBeNull();
  });

  it('seeds selection on open and emits on confirm when ready', () => {
    const confirmed: ILocationSelection[] = [];
    component.confirmed.subscribe((v) => confirmed.push(v));
    fixture.componentRef.setInput('value', { province: 'southern', district: 'mazabuka' });
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    expect(component.isTempLocationReady()).toBe(true);
    const confirmBtn = Array.from(fixture.nativeElement.querySelectorAll('button')).find((el) =>
      (el as HTMLElement).textContent?.includes('Confirm'),
    ) as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(false);
    confirmBtn.click();
    expect(confirmed).toEqual([{ province: 'southern', district: 'mazabuka' }]);
  });

  it('requires both segments for multi-layer countries (zw)', () => {
    fixture.componentRef.setInput('countryCode', 'zw');
    fixture.componentRef.setInput('value', { province: 'masvingo' });
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect(component.isTempLocationReady()).toBe(false);

    component.handleTempLocationUpdate({ province: 'masvingo', district: 'bikita' });
    fixture.componentRef.setInput('open', false);
    fixture.componentRef.setInput('value', { province: 'masvingo', district: 'bikita' });
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect(component.isTempLocationReady()).toBe(true);
  });
});
