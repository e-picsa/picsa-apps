import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { INotificationEntry } from '@picsa/models';
import { PicsaNotificationFeedService } from '@picsa/shared/services/core/notifications';

import { NotificationFeedPageComponent } from './notification-feed.page';

describe('NotificationFeedPageComponent', () => {
  let component: NotificationFeedPageComponent;
  let fixture: ComponentFixture<NotificationFeedPageComponent>;

  const activeNotifs = signal<INotificationEntry[]>([
    {
      id: 'notif-1',
      title: 'First Alert',
      body: 'Body message 1',
      channel: 'weather_forecasts',
      priority: 'high',
      isSticky: false,
      createdAt: '2026-09-23T10:00:00Z',
      readAt: null,
      deletedAt: null,
      actionPayload: {
        label: 'Action 1',
        route: '/test',
      },
    },
    {
      id: 'notif-2',
      title: 'Second Alert',
      body: 'Body message 2',
      channel: 'app_updates',
      priority: 'medium',
      isSticky: true,
      createdAt: '2026-09-23T09:00:00Z',
      readAt: '2026-09-23T09:30:00Z',
      deletedAt: null,
    },
  ]);

  const mockFeedService = {
    activeNotifications: activeNotifs,
    unreadCount: signal(1),
    executeAction: jest.fn(),
    dismissNotification: jest.fn(),
    markAllAsRead: jest.fn(),
    seedDevSamples: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationFeedPageComponent, PicsaTranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: PicsaNotificationFeedService, useValue: mockFeedService }],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationFeedPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders active notifications in feed', () => {
    expect(component).toBeTruthy();
    const cards = fixture.nativeElement.querySelectorAll('.notification-card');
    expect(cards.length).toBe(2);
  });

  it('filters notifications by unread mode', () => {
    component.filterMode.set('unread');
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.notification-card');
    expect(cards.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('First Alert');
  });

  it('calls executeAction on action button click', () => {
    const card = fixture.debugElement.query(By.css('.notification-card'));
    const actionBtn = card.nativeElement.querySelector('button[matbutton="filled"]');
    actionBtn.click();
    expect(mockFeedService.executeAction).toHaveBeenCalledWith(activeNotifs()[0], 'primary');
  });

  it('calls dismissNotification on dismiss click', () => {
    const dismissBtns = fixture.nativeElement.querySelectorAll('button[color="warn"]');
    expect(dismissBtns.length).toBe(1); // Only non-sticky item has dismiss
    dismissBtns[0].click();
    expect(mockFeedService.dismissNotification).toHaveBeenCalledWith('notif-1');
  });
});
