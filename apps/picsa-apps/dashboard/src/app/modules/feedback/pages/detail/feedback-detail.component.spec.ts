import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { PicsaTranslateModule, PicsaTranslateService } from '@picsa/i18n';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { BehaviorSubject } from 'rxjs';

import { FeedbackDashboardService } from '../../services/feedback-dashboard.service';
import { FeedbackDetailComponent } from './feedback-detail.component';

describe('FeedbackDetailComponent', () => {
  let component: FeedbackDetailComponent;
  let fixture: ComponentFixture<FeedbackDetailComponent>;
  let mockService: { getById: jest.Mock; getSignedUrl: jest.Mock; update: jest.Mock };
  let mockNotification: { showErrorNotification: jest.Mock; showSuccessNotification: jest.Mock };
  let mockTranslate: { instant: jest.Mock };
  let paramMap$: BehaviorSubject<Map<string, string>>;

  const mockRow = {
    id: 'row-123',
    type: 'bug_report' as const,
    user_id: null,
    comment: 'Test comment',
    device_info: { app_version: '1.0.0', os: 'Android' },
    screenshot_path: 'reports/row-123.png',
    status: 'open' as const,
    admin_notes: null,
    created_at: '2026-09-16T00:00:00Z',
    updated_at: '2026-09-16T00:00:00Z',
  };

  const mockRow2 = {
    ...mockRow,
    id: 'row-456',
    comment: 'Second report',
  };

  function buildParamMap(id: string | null): Map<string, string> {
    const map = new Map<string, string>();
    if (id !== null) {
      map.set('id', id);
    }
    return map;
  }

  beforeEach(async () => {
    mockService = {
      getById: jest.fn().mockResolvedValue(mockRow),
      getSignedUrl: jest.fn().mockResolvedValue({ signed_url: 'https://example.com/screenshot.png', expires_in: 300 }),
      update: jest.fn().mockResolvedValue({ ...mockRow, status: 'in_review' as const }),
    };
    mockNotification = { showErrorNotification: jest.fn(), showSuccessNotification: jest.fn() };
    mockTranslate = { instant: jest.fn().mockImplementation((v: string) => v) };
    paramMap$ = new BehaviorSubject(buildParamMap('row-123'));

    await TestBed.configureTestingModule({
      imports: [FeedbackDetailComponent, PicsaTranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        { provide: FeedbackDashboardService, useValue: mockService },
        { provide: PicsaNotificationService, useValue: mockNotification },
        { provide: PicsaTranslateService, useValue: mockTranslate },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load row by id from route params', () => {
    expect(mockService.getById).toHaveBeenCalledWith('row-123');
    expect(component.row()).toEqual(mockRow);
  });

  it('should reload when route param changes to a new id', async () => {
    mockService.getById.mockResolvedValue(mockRow2);
    paramMap$.next(buildParamMap('row-456'));
    await fixture.whenStable();
    expect(mockService.getById).toHaveBeenCalledWith('row-456');
    expect(component.row()?.id).toBe('row-456');
  });

  it('should show not-found state for empty id', async () => {
    paramMap$.next(buildParamMap(null));
    await fixture.whenStable();
    expect(component.notFound()).toBe(true);
    expect(component.row()).toBeNull();
  });

  it('should call update and show success notification on save', async () => {
    component.status.set('in_review');
    component.adminNotes.set('Investigating');
    await component.save();
    expect(mockService.update).toHaveBeenCalledWith('row-123', {
      status: 'in_review',
      admin_notes: 'Investigating',
    });
    expect(mockNotification.showSuccessNotification).toHaveBeenCalledWith('Changes saved');
  });

  it('should save with empty string when admin notes are cleared', async () => {
    component.status.set('in_review');
    component.adminNotes.set('');
    await component.save();
    expect(mockService.update).toHaveBeenCalledWith('row-123', {
      status: 'in_review',
      admin_notes: '',
    });
  });

  it('should not save when no changes', () => {
    expect(component.canSave()).toBe(false);
  });

  it('should show spinner inside flex wrapper when saving', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const saveButton = fixture.nativeElement.querySelector(
      'button[color="primary"][class*="w-full"]',
    ) as HTMLButtonElement;
    expect(saveButton).toBeTruthy();

    // spinner absent when not saving
    expect(saveButton.querySelector('mat-spinner')).toBeNull();

    // enable saving state
    component.saving.set(true);
    fixture.detectChanges();

    const spinner = saveButton.querySelector('mat-spinner') as HTMLElement;
    expect(spinner).toBeTruthy();
    expect(spinner.closest('.flex')).toBeTruthy();
  });

  it('should not overwrite row when a stale response resolves after a newer id was requested', async () => {
    // Simulate two overlapping getById calls resolving out of order.
    // The slow "row-123" call resolves AFTER "row-456" has already been requested and resolved.
    const pending: Record<string, (v: any) => void> = {};
    mockService.getById.mockImplementation(
      (id: string) =>
        new Promise((resolve) => {
          pending[id] = resolve;
        }),
    );

    // Request row-123 (slow)
    paramMap$.next(buildParamMap('row-123'));
    // Request row-456 (fast)
    paramMap$.next(buildParamMap('row-456'));

    // Resolve row-456 first
    pending['row-456'](mockRow2);
    await fixture.whenStable();
    expect(component.row()?.id).toBe('row-456');

    // Now resolve the stale row-123 — it must NOT overwrite
    pending['row-123'](mockRow);
    await fixture.whenStable();
    expect(component.row()?.id).toBe('row-456');
  });
});
