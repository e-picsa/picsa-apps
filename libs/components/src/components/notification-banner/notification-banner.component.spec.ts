import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Event, NavigationEnd, Router } from '@angular/router';
import { PermissionState } from '@capacitor/core';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { PicsaPushNotificationService } from '@picsa/shared/services/core/push-notifications.service';
import { Subject } from 'rxjs';

import { NOTIFICATION_BANNER_STORAGE_KEY, PicsaNotificationBannerComponent } from './notification-banner.component';

describe('PicsaNotificationBannerComponent', () => {
  let component: PicsaNotificationBannerComponent;
  let fixture: ComponentFixture<PicsaNotificationBannerComponent>;
  let routerEvents$: Subject<Event>;
  let pushNotificationServiceMock: {
    permissionStatus: ReturnType<typeof signal<PermissionState | null>>;
    isPermissionGranted: ReturnType<typeof signal<boolean>>;
    requestNotificationPermissions: jest.Mock;
  };
  let notificationServiceMock: {
    showSuccessNotification: jest.Mock;
  };
  let routerMock: {
    url: string;
    events: Subject<Event>;
  };

  beforeEach(async () => {
    localStorage.clear();
    routerEvents$ = new Subject<Event>();

    pushNotificationServiceMock = {
      permissionStatus: signal<PermissionState | null>('prompt'),
      isPermissionGranted: signal(false),
      requestNotificationPermissions: jest.fn().mockResolvedValue(true),
    };

    notificationServiceMock = {
      showSuccessNotification: jest.fn(),
    };

    routerMock = {
      url: '/farmer',
      events: routerEvents$,
    };

    await TestBed.configureTestingModule({
      imports: [PicsaNotificationBannerComponent, PicsaTranslateModule.forRoot()],
      providers: [
        { provide: PicsaPushNotificationService, useValue: pushNotificationServiceMock },
        { provide: PicsaNotificationService, useValue: notificationServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PicsaNotificationBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is visible by default on home page when permission is not granted', () => {
    expect(component.visible()).toBe(true);
  });

  it('is hidden when permission is already granted', () => {
    pushNotificationServiceMock.isPermissionGranted.set(true);
    expect(component.visible()).toBe(false);
  });

  it('is hidden when permission was denied', () => {
    pushNotificationServiceMock.permissionStatus.set('denied');
    expect(component.visible()).toBe(false);
  });

  it('is hidden when navigated to a subpage and homeOnly is true', () => {
    routerEvents$.next(new NavigationEnd(1, '/farmer/climate-forecast', '/farmer/climate-forecast'));
    expect(component.visible()).toBe(false);
  });

  it('requests permission and shows success notification when action is clicked', async () => {
    jest.spyOn(component.permissionRequested, 'emit');
    await component.onActionClicked(component.notification());

    expect(pushNotificationServiceMock.requestNotificationPermissions).toHaveBeenCalled();
    expect(component.permissionRequested.emit).toHaveBeenCalledWith(true);
    expect(notificationServiceMock.showSuccessNotification).toHaveBeenCalledWith('Notifications enabled');
    expect(component.isDismissed()).toBe(true);
  });

  it('dismisses banner and persists to localStorage on dismiss click', () => {
    jest.spyOn(component.dismissed, 'emit');
    component.onDismissClicked();

    expect(component.isDismissed()).toBe(true);
    expect(component.visible()).toBe(false);
    expect(localStorage.getItem(NOTIFICATION_BANNER_STORAGE_KEY)).toBe('true');
    expect(component.dismissed.emit).toHaveBeenCalledWith(component.notification().id);
  });
});
