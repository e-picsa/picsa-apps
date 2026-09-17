import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { PicsaTranslateModule } from '@picsa/i18n';
import { AppUserService } from '@picsa/shared/services/core/appUser.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { AppUpdateService } from '@picsa/shared/services/native/app-update';

import { PicsaVersionDebugDialogComponent } from './version-debug-dialog.component';

jest.mock('@capacitor/core', () => {
  const actual = jest.requireActual('@capacitor/core');
  return {
    ...actual,
    Capacitor: {
      ...actual.Capacitor,
      isNativePlatform: jest.fn().mockReturnValue(true),
    },
  };
});

jest.mock('@capacitor/device', () => ({
  Device: {
    getInfo: jest.fn().mockResolvedValue({ operatingSystem: 'android', osVersion: '14' }),
    getId: jest.fn().mockResolvedValue({ identifier: 'test-device-id' }),
  },
}));

describe('PicsaVersionDebugDialogComponent', () => {
  let component: PicsaVersionDebugDialogComponent;
  let fixture: ComponentFixture<PicsaVersionDebugDialogComponent>;
  let dialogRefMock: { close: jest.Mock };
  let appUserServiceMock: {
    isInternalTester: ReturnType<typeof signal<boolean>>;
    userId: jest.Mock;
    fcmToken: ReturnType<typeof signal<string | null>>;
    setInternalTester: jest.Mock;
  };
  let appUpdateServiceMock: {
    checkUpdateStatus: jest.Mock;
    startFlexibleUpdate: jest.Mock;
    completeUpdate: jest.Mock;
    openStore: jest.Mock;
    isUpdateAvailable: ReturnType<typeof signal<boolean>>;
    isUpdateDownloading: ReturnType<typeof signal<boolean>>;
    isUpdateDownloaded: ReturnType<typeof signal<boolean>>;
  };
  let notificationServiceMock: {
    showSuccessNotification: jest.Mock;
    showErrorNotification: jest.Mock;
  };

  beforeEach(async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    dialogRefMock = { close: jest.fn() };
    appUserServiceMock = {
      isInternalTester: signal(false),
      userId: jest.fn().mockReturnValue('test-user-id'),
      fcmToken: signal('mock-fcm-token-12345'),
      setInternalTester: jest.fn(),
    };
    appUpdateServiceMock = {
      checkUpdateStatus: jest.fn().mockResolvedValue({
        isNative: true,
        availability: 'UPDATE_AVAILABLE',
        currentVersionCode: '5012000',
      }),
      startFlexibleUpdate: jest.fn().mockResolvedValue(undefined),
      completeUpdate: jest.fn().mockResolvedValue(undefined),
      openStore: jest.fn().mockResolvedValue(undefined),
      isUpdateAvailable: signal(true),
      isUpdateDownloading: signal(false),
      isUpdateDownloaded: signal(false),
    };
    notificationServiceMock = {
      showSuccessNotification: jest.fn(),
      showErrorNotification: jest.fn(),
    };

    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });

    await TestBed.configureTestingModule({
      imports: [PicsaVersionDebugDialogComponent, PicsaTranslateModule.forRoot()],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: AppUserService, useValue: appUserServiceMock },
        { provide: AppUpdateService, useValue: appUpdateServiceMock },
        { provide: PicsaNotificationService, useValue: notificationServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PicsaVersionDebugDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads diagnostics on init including notification token', async () => {
    await component.ngOnInit();
    expect(Device.getInfo).toHaveBeenCalled();
    expect(appUpdateServiceMock.checkUpdateStatus).toHaveBeenCalled();
    expect(component.formattedJson()).toContain('5012000');
    expect(component.formattedJson()).toContain('mock-fcm-token-12345');
  });

  it('toggles internal tester status', () => {
    component.onToggleTester(true);
    expect(appUserServiceMock.setInternalTester).toHaveBeenCalledWith(true, true);
    expect(notificationServiceMock.showSuccessNotification).toHaveBeenCalledWith('Internal Tester mode enabled');
  });

  it('copies debug JSON to clipboard', async () => {
    await component.copyDebugJson();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(component.formattedJson());
    expect(notificationServiceMock.showSuccessNotification).toHaveBeenCalledWith('Diagnostics copied to clipboard');
  });

  it('copies notification token to clipboard', async () => {
    await component.copyNotificationToken();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('mock-fcm-token-12345');
    expect(notificationServiceMock.showSuccessNotification).toHaveBeenCalledWith(
      'Notification token copied to clipboard',
    );
  });

  it('triggers flexible download', async () => {
    await component.startDownload();
    expect(appUpdateServiceMock.startFlexibleUpdate).toHaveBeenCalled();
  });

  it('closes dialog', () => {
    component.close();
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

  it('omits native-only cards and fields on web', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    appUpdateServiceMock.checkUpdateStatus.mockResolvedValueOnce({
      isNative: false,
      availability: 'WEB_NOT_SUPPORTED',
    });
    await component.ngOnInit();
    fixture.detectChanges();

    expect(component.isNative()).toBe(false);
    const json = component.formattedJson();
    expect(json).not.toContain('notification_token');
    expect(json).not.toContain('update');

    const nativeElement: HTMLElement = fixture.nativeElement;
    expect(nativeElement.textContent).not.toContain('Google Play Update');
    expect(nativeElement.textContent).not.toContain('Notification Token');
    expect(nativeElement.textContent).toContain('Web');
  });
});
