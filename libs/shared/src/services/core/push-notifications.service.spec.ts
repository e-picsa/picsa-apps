import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

import { AppUpdateService } from '../native/app-update';
import { AppUserService } from './appUser.service';
import { PicsaNotificationService } from './notification.service';
import { PicsaPushNotificationService } from './push-notifications.service';

jest.mock('@capacitor/core', () => {
  const actual = jest.requireActual('@capacitor/core');
  return {
    ...actual,
    Capacitor: {
      ...actual.Capacitor,
      isNativePlatform: jest.fn(),
      getPlatform: jest.fn(),
    },
    registerPlugin: jest.fn().mockReturnValue({}),
  };
});

jest.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    checkPermissions: jest.fn(),
    requestPermissions: jest.fn(),
    createChannel: jest.fn(),
    register: jest.fn(),
    removeAllListeners: jest.fn(),
    addListener: jest.fn(),
  },
}));

describe('PicsaPushNotificationService', () => {
  let service: PicsaPushNotificationService;
  let appUserServiceMock: { setFcmToken: jest.Mock };
  let appUpdateServiceMock: { checkForUpdates: jest.Mock; openStore: jest.Mock };
  let notificationServiceMock: { showUserNotification: jest.Mock };
  let routerMock: { navigate: jest.Mock };
  type CallbackFn = (...args: any[]) => any;
  const listeners: Record<string, CallbackFn> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    appUserServiceMock = { setFcmToken: jest.fn() };
    appUpdateServiceMock = { checkForUpdates: jest.fn().mockResolvedValue(null), openStore: jest.fn() };
    notificationServiceMock = { showUserNotification: jest.fn() };
    routerMock = { navigate: jest.fn() };

    (PushNotifications.addListener as jest.Mock).mockImplementation((event: string, fn: CallbackFn) => {
      listeners[event] = fn;
      return Promise.resolve({ remove: jest.fn() });
    });

    TestBed.configureTestingModule({
      providers: [
        PicsaPushNotificationService,
        { provide: AppUserService, useValue: appUserServiceMock },
        { provide: AppUpdateService, useValue: appUpdateServiceMock },
        { provide: PicsaNotificationService, useValue: notificationServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    service = TestBed.inject(PicsaPushNotificationService);
  });

  it('skips initialization when on web/non-native platform', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

    await service.initializePushNotifications();
    expect(PushNotifications.checkPermissions).not.toHaveBeenCalled();
    expect(PushNotifications.register).not.toHaveBeenCalled();
  });

  it('registers and configures notification channel on Android', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Capacitor.getPlatform as jest.Mock).mockReturnValue('android');
    (PushNotifications.checkPermissions as jest.Mock).mockResolvedValue({ receive: 'granted' });
    (PushNotifications.register as jest.Mock).mockResolvedValue(undefined);
    (PushNotifications.removeAllListeners as jest.Mock).mockResolvedValue(undefined);

    await service.initializePushNotifications();

    expect(PushNotifications.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'default', name: 'General' }),
    );
    expect(PushNotifications.register).toHaveBeenCalled();
    expect(PushNotifications.addListener).toHaveBeenCalledWith('registration', expect.any(Function));
    expect(PushNotifications.addListener).toHaveBeenCalledWith('pushNotificationReceived', expect.any(Function));
    expect(PushNotifications.addListener).toHaveBeenCalledWith('pushNotificationActionPerformed', expect.any(Function));
  });

  it('passes received FCM token to AppUserService', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Capacitor.getPlatform as jest.Mock).mockReturnValue('android');
    (PushNotifications.checkPermissions as jest.Mock).mockResolvedValue({ receive: 'granted' });

    await service.initializePushNotifications();

    // Trigger registration callback
    expect(listeners['registration']).toBeDefined();
    listeners['registration']({ value: 'test-fcm-token-123' });

    expect(appUserServiceMock.setFcmToken).toHaveBeenCalledWith('test-fcm-token-123');
  });

  it('handles update action when notification clicked', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Capacitor.getPlatform as jest.Mock).mockReturnValue('android');
    (PushNotifications.checkPermissions as jest.Mock).mockResolvedValue({ receive: 'granted' });

    await service.initializePushNotifications();

    expect(listeners['pushNotificationActionPerformed']).toBeDefined();
    await listeners['pushNotificationActionPerformed']({
      actionId: 'tap',
      notification: {
        data: { action: 'app_update', openStore: true },
      },
    });

    expect(appUpdateServiceMock.checkForUpdates).toHaveBeenCalled();
    expect(appUpdateServiceMock.openStore).toHaveBeenCalled();
  });
});
