import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { AppUpdate, AppUpdateAvailability, FlexibleUpdateInstallStatus } from '@capawesome/capacitor-app-update';

import { PicsaNotificationService } from '../core/notification.service';
import { AppUpdateService } from './app-update';

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

jest.mock('@capawesome/capacitor-app-update', () => ({
  AppUpdate: {
    getAppUpdateInfo: jest.fn(),
    startFlexibleUpdate: jest.fn(),
    completeFlexibleUpdate: jest.fn(),
    openAppStore: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  AppUpdateAvailability: {
    UNKNOWN: 0,
    UPDATE_NOT_AVAILABLE: 1,
    UPDATE_AVAILABLE: 2,
    UPDATE_IN_PROGRESS: 3,
  },
  FlexibleUpdateInstallStatus: {
    UNKNOWN: 0,
    PENDING: 1,
    DOWNLOADING: 2,
    INSTALLING: 3,
    INSTALLED: 4,
    FAILED: 5,
    CANCELED: 6,
    DOWNLOADED: 11,
  },
}));

describe('AppUpdateService', () => {
  let service: AppUpdateService;
  let notificationServiceMock: {
    showSuccessNotification: jest.Mock;
    showUserNotification: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    notificationServiceMock = {
      showSuccessNotification: jest.fn(),
      showUserNotification: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [AppUpdateService, { provide: PicsaNotificationService, useValue: notificationServiceMock }],
    });

    service = TestBed.inject(AppUpdateService);
  });

  it('skips check if not on a native platform', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

    const result = await service.checkForUpdates();
    expect(result).toBeNull();
    expect(AppUpdate.getAppUpdateInfo).not.toHaveBeenCalled();
  });

  it('triggers flexible update when update is available on native platform', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (AppUpdate.getAppUpdateInfo as jest.Mock).mockResolvedValue({
      updateAvailability: AppUpdateAvailability.UPDATE_AVAILABLE,
      flexibleUpdateAllowed: true,
      currentVersionCode: '5012000',
      availableVersionCode: '5013000',
    });
    (AppUpdate.addListener as jest.Mock).mockResolvedValue({ remove: jest.fn() });
    (AppUpdate.startFlexibleUpdate as jest.Mock).mockResolvedValue({ code: 0 });

    const result = await service.checkForUpdates();
    expect(result).toBeDefined();
    expect(service.isUpdateAvailable()).toBe(true);
    expect(AppUpdate.addListener).toHaveBeenCalledWith('onFlexibleUpdateStateChange', expect.any(Function));
    expect(AppUpdate.startFlexibleUpdate).toHaveBeenCalled();
    // Verify completeFlexibleUpdate is NOT called immediately
    expect(AppUpdate.completeFlexibleUpdate).not.toHaveBeenCalled();
  });

  it('notifies user if update is already downloaded', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (AppUpdate.getAppUpdateInfo as jest.Mock).mockResolvedValue({
      updateAvailability: AppUpdateAvailability.UPDATE_AVAILABLE,
      flexibleUpdateAllowed: true,
      installStatus: FlexibleUpdateInstallStatus.DOWNLOADED,
    });

    await service.checkForUpdates();
    expect(service.isUpdateDownloaded()).toBe(true);
    expect(notificationServiceMock.showSuccessNotification).toHaveBeenCalled();
  });

  it('calls completeFlexibleUpdate when completeUpdate is triggered', async () => {
    (AppUpdate.completeFlexibleUpdate as jest.Mock).mockResolvedValue(undefined);

    await service.completeUpdate();
    expect(AppUpdate.completeFlexibleUpdate).toHaveBeenCalled();
  });

  it('returns diagnostics from checkUpdateStatus', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (AppUpdate.getAppUpdateInfo as jest.Mock).mockResolvedValue({
      updateAvailability: AppUpdateAvailability.UPDATE_NOT_AVAILABLE,
      currentVersionCode: '5012000',
      currentVersionName: '5.12.0',
    });

    const diagnostics = await service.checkUpdateStatus();
    expect(diagnostics.isNative).toBe(true);
    expect(diagnostics.currentVersionCode).toBe('5012000');
    expect(diagnostics.availability).toBe('UPDATE_NOT_AVAILABLE');
  });

  it('resets installStatus to null if subsequent check omits installStatus', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    // First check reports DOWNLOADED
    (AppUpdate.getAppUpdateInfo as jest.Mock).mockResolvedValueOnce({
      updateAvailability: AppUpdateAvailability.UPDATE_AVAILABLE,
      flexibleUpdateAllowed: true,
      installStatus: FlexibleUpdateInstallStatus.DOWNLOADED,
    });

    await service.checkForUpdates();
    expect(service.isUpdateDownloaded()).toBe(true);

    // Second check reports no installStatus (e.g. after update was applied/cleared)
    (AppUpdate.getAppUpdateInfo as jest.Mock).mockResolvedValueOnce({
      updateAvailability: AppUpdateAvailability.UPDATE_NOT_AVAILABLE,
    });

    await service.checkUpdateStatus();
    expect(service.installStatus()).toBeNull();
    expect(service.isUpdateDownloaded()).toBe(false);
  });
});
