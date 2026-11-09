import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PicsaFallbackImageComponent } from './fallback-image.component';

describe('PicsaFallbackImageComponent', () => {
  let component: PicsaFallbackImageComponent;
  let fixture: ComponentFixture<PicsaFallbackImageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PicsaFallbackImageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PicsaFallbackImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders default fallback badge when no src provided', () => {
    const el: HTMLElement = fixture.nativeElement;
    const badge = el.querySelector('.fallback-badge');
    expect(badge?.textContent?.trim()).toBe('Doc');
    const card = el.querySelector('.fallback-badge-card');
    expect(card?.getAttribute('data-fallback-type')).toBe('document');
  });

  it('renders correct preset for pdf and video types', () => {
    fixture.componentRef.setInput('fallbackType', 'pdf');
    fixture.detectChanges();
    let card = fixture.nativeElement.querySelector('.fallback-badge-card');
    expect(card?.getAttribute('data-fallback-type')).toBe('pdf');
    expect(fixture.nativeElement.querySelector('.fallback-badge')?.textContent?.trim()).toBe('PDF');

    fixture.componentRef.setInput('fallbackType', 'video');
    fixture.detectChanges();
    card = fixture.nativeElement.querySelector('.fallback-badge-card');
    expect(card?.getAttribute('data-fallback-type')).toBe('video');
    expect(fixture.nativeElement.querySelector('.fallback-badge')?.textContent?.trim()).toBe('Video');
  });

  it('supports custom label override', () => {
    fixture.componentRef.setInput('fallbackType', 'folder');
    fixture.componentRef.setInput('label', 'Collection');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.fallback-badge')?.textContent?.trim()).toBe('Collection');
  });

  it('falls back to badge if image fails to load', () => {
    fixture.componentRef.setInput('src', 'https://example.com/invalid.png');
    fixture.detectChanges();
    expect(component.showImage()).toBe(true);

    component.onImageError();
    fixture.detectChanges();

    expect(component.showImage()).toBe(false);
    expect(fixture.nativeElement.querySelector('.fallback-badge-card')).toBeTruthy();
  });
});
