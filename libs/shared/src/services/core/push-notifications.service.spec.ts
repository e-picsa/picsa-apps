import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, PushNotificationSchema } from '@capacitor/push-notifications';

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
      isNativePlatform: jest.fn().mockReturnValue(true),
      getPlatform: jest.fn().mockReturnValue('android'),
    },
  };
});

jest.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    checkPermissions: jest.fn(),
    requestPermissions: jest.fn(),
    createChannel: jest.fn(),
    removeAllListeners: jest.fn(),
    addListener: jest.fn(),
    register: jest.fn(),
  },
}));

type CallbackFn = (...args: unknown[]) => unknown;

describe('PicsaPushNotificationService', () => {
  let service: PicsaPushNotificationService;
  let appUserServiceMock: { setFcmToken: jest.Mock };
  let appUpdateServiceMock: {
    checkForUpdates: jest.Mock;
    openStore: jest.Mock;
  };
  let notificationServiceMock: { showUserNotification: jest.Mock };
  let routerMock: { navigateByUrl: jest.Mock };
  let listeners: { [key: string]: CallbackFn };

  beforeEach(() => {
    jest.clearAllMocks();
    listeners = {};

    appUserServiceMock = {
      setFcmToken: jest.fn(),
    };

    appUpdateServiceMock = {
      checkForUpdates: jest.fn().mockResolvedValue(undefined),
      openStore: jest.fn().mockResolvedValue(undefined),
    };

    notificationServiceMock = {
      showUserNotification: jest.fn(),
    };

    routerMock = {
      navigateByUrl: jest.fn(),
    };

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

  it('does not proactively prompt the user if permission is prompt on app startup', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (PushNotifications.checkPermissions as jest.Mock).mockResolvedValue({ receive: 'prompt' });

    await service.initializePushNotifications();

    expect(PushNotifications.requestPermissions).not.toHaveBeenCalled();
    expect(PushNotifications.register).not.toHaveBeenCalled();
    expect(service.isPermissionGranted()).toBe(false);
  });

  it('registers and configures notification channel on Android if already granted', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Capacitor.getPlatform as jest.Mock).mockReturnValue('android');
    (PushNotifications.checkPermissions as jest.Mock).mockResolvedValue({ receive: 'granted' });
    (PushNotifications.register as jest.Mock).mockResolvedValue(undefined);
    (PushNotifications.removeAllListeners as jest.Mock).mockResolvedValue(undefined);

    await service.initializePushNotifications();

    expect(PushNotifications.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'default', name: 'General' }),
    );
    expect(PushNotifications.addListener).toHaveBeenCalledWith('registration', expect.any(Function));
    expect(PushNotifications.addListener).toHaveBeenCalledWith('pushNotificationReceived', expect.any(Function));
    expect(PushNotifications.addListener).toHaveBeenCalledWith('pushNotificationActionPerformed', expect.any(Function));
    expect(PushNotifications.register).toHaveBeenCalled();
    expect(service.isPermissionGranted()).toBe(true);

    // Listeners must be registered before calling register() to prevent missing synchronous/early token events
    const addListenerSpy = PushNotifications.addListener as jest.Mock;
    const registerSpy = PushNotifications.register as jest.Mock;
    expect(addListenerSpy.mock.invocationCallOrder[0]).toBeLessThan(registerSpy.mock.invocationCallOrder[0]);
  });

  it('requests permissions on-demand and registers when granted', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Capacitor.getPlatform as jest.Mock).mockReturnValue('android');
    (PushNotifications.requestPermissions as jest.Mock).mockResolvedValue({ receive: 'granted' });
    (PushNotifications.register as jest.Mock).mockResolvedValue(undefined);
    (PushNotifications.removeAllListeners as jest.Mock).mockResolvedValue(undefined);

    const granted = await service.requestNotificationPermissions();

    expect(granted).toBe(true);
    expect(PushNotifications.requestPermissions).toHaveBeenCalled();
    expect(PushNotifications.register).toHaveBeenCalled();
    expect(service.isPermissionGranted()).toBe(true);
  });

  it('returns false when permissions request is denied', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (PushNotifications.requestPermissions as jest.Mock).mockResolvedValue({ receive: 'denied' });

    const granted = await service.requestNotificationPermissions();

    expect(granted).toBe(false);
    expect(PushNotifications.register).not.toHaveBeenCalled();
    expect(service.isPermissionGranted()).toBe(false);
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

  it('displays user notification when push notification received in foreground', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Capacitor.getPlatform as jest.Mock).mockReturnValue('android');
    (PushNotifications.checkPermissions as jest.Mock).mockResolvedValue({ receive: 'granted' });

    await service.initializePushNotifications();

    expect(listeners['pushNotificationReceived']).toBeDefined();
    listeners['pushNotificationReceived']({
      title: 'Update Available',
      body: 'A new version of PICSA is ready',
    } as PushNotificationSchema);

    expect(notificationServiceMock.showUserNotification).toHaveBeenCalledWith(
      {
        message: 'Update Available: A new version of PICSA is ready',
        matIcon: 'notifications',
      },
      { duration: 6000 },
    );
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

    expect(appUpdateServiceMock.openStore).toHaveBeenCalled();
  });
});
