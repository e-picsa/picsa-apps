import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PicsaTranslateModule } from '@picsa/i18n';

import { FeedbackService } from '../../../services/core/feedback/feedback.service';
import { ScreenshotService } from '../../../services/core/feedback/screenshot.service';
import { FeedbackPreferenceService } from '../services/feedback-preference.service';
import { FeedbackDialogComponent } from './feedback-dialog.component';

describe('FeedbackDialogComponent', () => {
  let component: FeedbackDialogComponent;
  let fixture: ComponentFixture<FeedbackDialogComponent>;
  let preferenceService: FeedbackPreferenceService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackDialogComponent, PicsaTranslateModule.forRoot()],
      providers: [
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { screenPath: '/farmer' } },
        {
          provide: ScreenshotService,
          useValue: { capture: jest.fn(), attachFromGallery: jest.fn(), downscaleBase64: jest.fn() },
        },
        { provide: FeedbackService, useValue: { submit: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackDialogComponent);
    component = fixture.componentInstance;
    preferenceService = TestBed.inject(FeedbackPreferenceService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults to feedback type and disables submit without comment', () => {
    expect(component.type()).toBe('feedback');
    expect(component.canSubmit()).toBe(false);
  });

  it('enables submit when a valid comment is entered', () => {
    component.comment.set('Something useful');
    expect(component.canSubmit()).toBe(true);
  });

  it('toggles floating FAB preference', () => {
    const setSpy = jest.spyOn(preferenceService, 'setShowFloatingFab');
    component.toggleShowFab(true);
    expect(component.showFabSetting()).toBe(true);
    expect(setSpy).toHaveBeenCalledWith(true);
  });

  it('sets submitted on successful result', async () => {
    const feedbackService = TestBed.inject(FeedbackService) as any;
    feedbackService.submit.mockResolvedValue('submitted');
    component.comment.set('Good feedback');
    await component.submit();
    expect(component.submitted()).toBe(true);
    expect(component.queued()).toBe(false);
    expect(component.error()).toBe('');
  });

  it('sets queued on pending result, disables submit, and does NOT auto-close', async () => {
    jest.useFakeTimers();
    const feedbackService = TestBed.inject(FeedbackService) as any;
    const dialogRef = TestBed.inject(MatDialogRef) as any;
    feedbackService.submit.mockResolvedValue('pending');
    component.comment.set('Offline feedback');
    await component.submit();
    expect(component.queued()).toBe(true);
    expect(component.submitted()).toBe(false);
    expect(component.canSubmit()).toBe(false);
    expect(component.error()).toBe('');
    // Second submit call must be blocked by canSubmit
    feedbackService.submit.mockClear();
    await component.submit();
    expect(feedbackService.submit).not.toHaveBeenCalled();
    // Advancing well beyond the old 1800 ms — dialog must NOT auto-close
    jest.advanceTimersByTime(5000);
    expect(dialogRef.close).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('sets retrying on failed result, disables submit, and does NOT auto-close', async () => {
    jest.useFakeTimers();
    const feedbackService = TestBed.inject(FeedbackService) as any;
    const dialogRef = TestBed.inject(MatDialogRef) as any;
    feedbackService.submit.mockResolvedValue('failed');
    component.comment.set('Bad feedback');
    await component.submit();
    expect(component.retrying()).toBe(true);
    expect(component.error()).toBe('');
    expect(component.submitted()).toBe(false);
    expect(component.queued()).toBe(false);
    expect(component.canSubmit()).toBe(false);
    // Second submit call must be blocked by canSubmit
    feedbackService.submit.mockClear();
    await component.submit();
    expect(feedbackService.submit).not.toHaveBeenCalled();
    // Advancing well beyond the old 1800 ms — dialog must NOT auto-close
    jest.advanceTimersByTime(5000);
    expect(dialogRef.close).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
