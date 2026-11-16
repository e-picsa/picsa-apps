import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { PicsaTranslateModule, PicsaTranslateService } from '@picsa/i18n';

import { FeedbackBadgeComponent } from '../../components/feedback-badge.component';
import { FeedbackDashboardService } from '../../services/feedback-dashboard.service';
import { FeedbackListComponent } from './feedback-list.component';

describe('FeedbackListComponent', () => {
  let component: FeedbackListComponent;
  let fixture: ComponentFixture<FeedbackListComponent>;
  let mockService: { list: jest.Mock };
  let mockRouter: { navigate: jest.Mock };
  let mockTranslate: { instant: jest.Mock };

  beforeEach(async () => {
    mockService = { list: jest.fn().mockResolvedValue([]) };
    mockRouter = { navigate: jest.fn() };
    mockTranslate = { instant: jest.fn().mockImplementation((v: string) => v) };

    await TestBed.configureTestingModule({
      imports: [FeedbackListComponent, FeedbackBadgeComponent, PicsaTranslateModule.forRoot(), NoopAnimationsModule],
    })
      .overrideComponent(FeedbackListComponent, {
        add: {
          providers: [
            { provide: FeedbackDashboardService, useValue: mockService },
            { provide: Router, useValue: mockRouter },
            { provide: PicsaTranslateService, useValue: mockTranslate },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FeedbackListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load list on init with default limit and offset', () => {
    expect(mockService.list).toHaveBeenCalledWith({ limit: 100, offset: 0 });
  });

  it('should apply filters and reload, forwarding all four filters', async () => {
    mockService.list.mockClear();
    component.selectedStatus.set('open');
    component.selectedType.set('bug_report');
    component.appVersion.set('1.0.0');
    component.os.set('Android');
    component.applyFilters();
    await fixture.whenStable();
    expect(mockService.list).toHaveBeenLastCalledWith({
      limit: 100,
      offset: 0,
      status: 'open',
      type: 'bug_report',
      app_version: '1.0.0',
      os: 'Android',
    });
  });

  it('should reset filters and reload with defaults', async () => {
    component.selectedStatus.set('open');
    component.selectedType.set('bug_report');
    component.appVersion.set('1.0.0');
    component.os.set('Android');
    mockService.list.mockClear();
    component.resetFilters();
    await fixture.whenStable();
    expect(component.selectedStatus()).toBeUndefined();
    expect(component.selectedType()).toBeUndefined();
    expect(component.appVersion()).toBe('');
    expect(component.os()).toBe('');
    expect(mockService.list).toHaveBeenLastCalledWith({ limit: 100, offset: 0 });
  });

  it('should navigate to detail page on row click', async () => {
    const reportRow = {
      id: 'test-123',
      type: 'feedback',
      user_id: null,
      comment: 'Test',
      device_info: {},
      screenshot_path: null,
      status: 'open',
      admin_notes: null,
      created_at: '',
      updated_at: '',
    };
    mockService.list.mockResolvedValue([reportRow]);
    await component.loadList();
    const row = component.rows()[0];
    component.openDetail(row);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/feedback', 'test-123']);
  });

  it('should show empty state when no rows returned', () => {
    expect(component.rows()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('should show inline error on load failure', async () => {
    mockService.list.mockRejectedValueOnce(new Error('fail'));
    await component.loadList();
    expect(component.error()).toBe('Failed to load feedback');
  });
});
