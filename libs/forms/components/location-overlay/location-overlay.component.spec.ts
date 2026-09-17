import { ComponentFixture, TestBed } from '@angular/core/testing';
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

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.fixed')).toBeNull();
  });

  it('seeds temp selection from value and emits on confirm when ready', () => {
    const confirmed: (string | undefined)[][] = [];
    component.confirmed.subscribe((v) => confirmed.push(v));
    fixture.componentRef.setInput('value', [undefined, undefined, 'zm', undefined, 'southern', 'mazabuka']);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    expect(component.isTempLocationReady()).toBe(true);
    const confirmBtn = Array.from(fixture.nativeElement.querySelectorAll('button')).find((el) =>
      (el as HTMLElement).textContent?.includes('Confirm'),
    ) as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(false);
    confirmBtn.click();
    expect(confirmed).toEqual([[undefined, undefined, 'zm', undefined, 'southern', 'mazabuka']]);
  });
});
