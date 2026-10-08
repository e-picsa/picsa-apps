import { TestBed } from '@angular/core/testing';

import { FEEDBACK_SHOW_FAB_STORAGE_KEY, FeedbackPreferenceService } from './feedback-preference.service';

describe('FeedbackPreferenceService', () => {
  let service: FeedbackPreferenceService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [FeedbackPreferenceService],
    });
    service = TestBed.inject(FeedbackPreferenceService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('defaults to false when no preference is stored in localStorage', () => {
    expect(service.showFloatingFab()).toBe(false);
  });

  it('updates signal and writes to localStorage when setShowFloatingFab is called', () => {
    service.setShowFloatingFab(true);
    expect(service.showFloatingFab()).toBe(true);
    expect(localStorage.getItem(FEEDBACK_SHOW_FAB_STORAGE_KEY)).toBe('true');

    service.setShowFloatingFab(false);
    expect(service.showFloatingFab()).toBe(false);
    expect(localStorage.getItem(FEEDBACK_SHOW_FAB_STORAGE_KEY)).toBe('false');
  });

  it('enables floating button on first menu open when no preference has been set', () => {
    expect(localStorage.getItem(FEEDBACK_SHOW_FAB_STORAGE_KEY)).toBeNull();
    service.enableOnFirstMenuOpen();

    expect(service.showFloatingFab()).toBe(true);
    expect(localStorage.getItem(FEEDBACK_SHOW_FAB_STORAGE_KEY)).toBe('true');
  });

  it('preserves explicit false preference when enableOnFirstMenuOpen is called', () => {
    service.setShowFloatingFab(false);
    expect(localStorage.getItem(FEEDBACK_SHOW_FAB_STORAGE_KEY)).toBe('false');

    service.enableOnFirstMenuOpen();
    expect(service.showFloatingFab()).toBe(false);
    expect(localStorage.getItem(FEEDBACK_SHOW_FAB_STORAGE_KEY)).toBe('false');
  });

  it('loads true from localStorage when previously saved as true', () => {
    localStorage.setItem(FEEDBACK_SHOW_FAB_STORAGE_KEY, 'true');
    const newService = new FeedbackPreferenceService();
    expect(newService.showFloatingFab()).toBe(true);
  });
});
