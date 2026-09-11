import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService, TranslateStore } from '@ngx-translate/core';
import { of } from 'rxjs';

import { FeedbackService } from '../../../services/core/feedback/feedback.service';
import { ScreenshotService } from '../../../services/core/feedback/screenshot.service';
import { FeedbackDialogComponent } from './feedback-dialog.component';

describe('FeedbackDialogComponent', () => {
  let component: FeedbackDialogComponent;
  let fixture: ComponentFixture<FeedbackDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { screenPath: '/farmer' } },
        {
          provide: ScreenshotService,
          useValue: { capture: jest.fn(), attachFromGallery: jest.fn(), downscaleBase64: jest.fn() },
        },
        { provide: FeedbackService, useValue: { submit: jest.fn() } },
        {
          provide: TranslateService,
          useValue: {
            get: jest.fn((key: string) => of(key)),
            instant: jest.fn((key: string) => key),
            stream: jest.fn((key: string) => of(key)),
            onLangChange: { subscribe: jest.fn() },
            onTranslationChange: { subscribe: jest.fn() },
            onDefaultLangChange: { subscribe: jest.fn() },
            currentLang: 'en',
          },
        },
        { provide: TranslateStore, useValue: { currentLang: 'en' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackDialogComponent);
    component = fixture.componentInstance;
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

  it('sets submitted on successful result', async () => {
    const feedbackService = TestBed.inject(FeedbackService) as any;
    feedbackService.submit.mockResolvedValue('submitted');
    component.comment.set('Good feedback');
    await component.submit();
    expect(component.submitted()).toBe(true);
    expect(component.queued()).toBe(false);
    expect(component.error()).toBe('');
  });

  it('sets queued on pending result without auto-close', async () => {
    const feedbackService = TestBed.inject(FeedbackService) as any;
    feedbackService.submit.mockResolvedValue('pending');
    component.comment.set('Offline feedback');
    await component.submit();
    expect(component.queued()).toBe(true);
    expect(component.submitted()).toBe(false);
    expect(component.error()).toBe('');
  });

  it('sets retrying on failed result instead of error', async () => {
    const feedbackService = TestBed.inject(FeedbackService) as any;
    feedbackService.submit.mockResolvedValue('failed');
    component.comment.set('Bad feedback');
    await component.submit();
    expect(component.retrying()).toBe(true);
    expect(component.error()).toBe('');
    expect(component.submitted()).toBe(false);
    expect(component.queued()).toBe(false);
  });
});
