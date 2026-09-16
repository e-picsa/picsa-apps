import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Device } from '@capacitor/device';
import { PicsaTranslateModule } from '@picsa/i18n';
import { AppUserService } from '@picsa/shared/services/core/appUser.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { AppUpdateService } from '@picsa/shared/services/native/app-update';

import { PicsaVersionDebugDialogComponent } from './version-debug-dialog.component';

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
    dialogRefMock = { close: jest.fn() };
    appUserServiceMock = {
      isInternalTester: signal(false),
      userId: jest.fn().mockReturnValue('test-user-id'),
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

  it('loads diagnostics on init', async () => {
    await component.ngOnInit();
    expect(Device.getInfo).toHaveBeenCalled();
    expect(appUpdateServiceMock.checkUpdateStatus).toHaveBeenCalled();
    expect(component.formattedJson()).toContain('5012000');
  });

  it('toggles internal tester status', () => {
    component.onToggleTester(true);
    expect(appUserServiceMock.setInternalTester).toHaveBeenCalledWith(true, true);
    expect(notificationServiceMock.showSuccessNotification).toHaveBeenCalledWith('Internal Tester mode enabled');
  });

  it('triggers flexible download', async () => {
    await component.startDownload();
    expect(appUpdateServiceMock.startFlexibleUpdate).toHaveBeenCalled();
  });

  it('closes dialog', () => {
    component.close();
    expect(dialogRefMock.close).toHaveBeenCalled();
  });
});
