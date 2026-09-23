import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { INotificationPreferences } from '@picsa/models';
import { PicsaNotificationFeedService } from '@picsa/shared/services/core/notifications';
import { PicsaPushNotificationService } from '@picsa/shared/services/core/push-notifications.service';

import { NotificationPreferencesPageComponent } from './notification-preferences.page';

describe('NotificationPreferencesPageComponent', () => {
  let component: NotificationPreferencesPageComponent;
  let fixture: ComponentFixture<NotificationPreferencesPageComponent>;

  const mockPermissionStatus = signal<'granted' | 'denied' | 'prompt' | null>('prompt');
  const mockPreferences = signal<INotificationPreferences>({
    id: 'user_preferences',
    channels: {
      weather_forecasts: true,
      agronomic_advisories: true,
      app_updates: true,
      general_announcements: true,
    },
    updatedAt: '2026-09-23T10:00:00Z',
  });

  const mockPushService = {
    permissionStatus: mockPermissionStatus,
    requestNotificationPermissions: jest.fn().mockResolvedValue(true),
  };

  const mockFeedService = {
    preferences: mockPreferences,
    updateChannelPreference: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    mockPermissionStatus.set('prompt');
    await TestBed.configureTestingModule({
      imports: [NotificationPreferencesPageComponent, PicsaTranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: PicsaPushNotificationService, useValue: mockPushService },
        { provide: PicsaNotificationFeedService, useValue: mockFeedService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationPreferencesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders permission status and request button when in prompt state', () => {
    expect(component).toBeTruthy();
    const btn = fixture.nativeElement.querySelector('button[color="primary"]');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Enable Push Notifications');

    btn.click();
    expect(mockPushService.requestNotificationPermissions).toHaveBeenCalled();
  });

  it('renders all 4 notification channel toggles', () => {
    const toggles = fixture.debugElement.queryAll(By.css('mat-slide-toggle'));
    expect(toggles.length).toBe(4);
  });

  it('calls updateChannelPreference when a toggle changes', () => {
    component.onToggleChannel('weather_forecasts', false);
    expect(mockFeedService.updateChannelPreference).toHaveBeenCalledWith('weather_forecasts', false);
  });

  it('hides permission request button when granted or denied', () => {
    mockPermissionStatus.set('granted');
    fixture.detectChanges();
    let btn = fixture.nativeElement.querySelector('button[color="primary"]');
    expect(btn).toBeFalsy();

    mockPermissionStatus.set('denied');
    fixture.detectChanges();
    btn = fixture.nativeElement.querySelector('button[color="primary"]');
    expect(btn).toBeFalsy();
    expect(fixture.nativeElement.textContent).toContain('Notifications are blocked');
  });
});
