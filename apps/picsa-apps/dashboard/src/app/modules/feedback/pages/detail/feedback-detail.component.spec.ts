import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { PicsaTranslateModule, PicsaTranslateService } from '@picsa/i18n';

import { FeedbackDashboardService } from '../../services/feedback-dashboard.service';
import { FeedbackDetailComponent } from './feedback-detail.component';

describe('FeedbackDetailComponent', () => {
  let component: FeedbackDetailComponent;
  let fixture: ComponentFixture<FeedbackDetailComponent>;
  let mockService: { getById: jest.Mock; getSignedUrl: jest.Mock; update: jest.Mock };
  let mockSnackBar: { open: jest.Mock };
  let mockTranslate: { instant: jest.Mock };

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

  beforeEach(async () => {
    mockService = {
      getById: jest.fn().mockResolvedValue(mockRow),
      getSignedUrl: jest.fn().mockResolvedValue({ signed_url: 'https://example.com/screenshot.png', expires_in: 300 }),
      update: jest.fn().mockResolvedValue({ ...mockRow, status: 'in_review' as const }),
    };
    mockSnackBar = { open: jest.fn() };
    mockTranslate = { instant: jest.fn().mockImplementation((v: string) => v) };

    await TestBed.configureTestingModule({
      imports: [FeedbackDetailComponent, PicsaTranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'row-123' } } } },
        { provide: FeedbackDashboardService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
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

  it('should show not-found state for empty results', async () => {
    mockService.getById.mockResolvedValue(null);
    const emptyFixture = TestBed.createComponent(FeedbackDetailComponent);
    emptyFixture.componentInstance.ngOnInit();
    await emptyFixture.whenStable();
    expect(emptyFixture.componentInstance.notFound()).toBe(true);
    expect(emptyFixture.componentInstance.row()).toBeNull();
  });

  it('should call update and show snackbar on save', async () => {
    component.status.set('in_review');
    component.adminNotes.set('Investigating');
    await component.save();
    expect(mockService.update).toHaveBeenCalledWith('row-123', {
      status: 'in_review',
      admin_notes: 'Investigating',
    });
    expect(mockSnackBar.open).toHaveBeenCalledWith('Changes saved', 'Dismiss', { duration: 2500 });
  });

  it('should not save when no changes', () => {
    expect(component.canSave()).toBe(false);
  });
});
