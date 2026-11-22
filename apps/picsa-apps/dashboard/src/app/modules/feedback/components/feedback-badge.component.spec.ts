import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PicsaTranslateModule } from '@picsa/i18n';

import { FeedbackBadgeComponent } from './feedback-badge.component';

describe('FeedbackBadgeComponent', () => {
  let component: FeedbackBadgeComponent;
  let fixture: ComponentFixture<FeedbackBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackBadgeComponent, PicsaTranslateModule.forRoot(), NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it.each(['open', 'in_review', 'resolved', 'closed'])('renders a label for status "%s"', (status) => {
    fixture.componentRef.setInput('kind', 'status');
    fixture.componentRef.setInput('value', status as any);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('span');
    expect(el).toBeTruthy();
    expect(el.classList.toString()).toContain('rounded-full');
  });

  it.each(['feedback', 'bug_report'])('renders a label for type "%s"', (type) => {
    fixture.componentRef.setInput('kind', 'type');
    fixture.componentRef.setInput('value', type);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('span');
    expect(el).toBeTruthy();
    expect(el.classList.toString()).toContain('rounded-full');
  });

  it('renders nothing for an unknown value', () => {
    fixture.componentRef.setInput('kind', 'status');
    fixture.componentRef.setInput('value', 'nonexistent');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('span')).toBeNull();
  });

  it('renders nothing for an empty value', () => {
    fixture.componentRef.setInput('kind', 'type');
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('span')).toBeNull();
  });
});
