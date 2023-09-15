import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Device, DeviceInfo } from '@capacitor/device';

import { IDeviceRecommendation } from './device-support.models';
import { DeviceTroubleshooterComponent } from './device-troubleshooter/device-troubleshooter.component';

@Injectable({ providedIn: 'root' })
export class DeviceSupportService {
  public recommendations: IDeviceRecommendation[] = [];
  private deviceInfo: DeviceInfo;

  constructor(private dialog: MatDialog) {}

  public async runDeviceTroubleshooter() {
    await this.checkDeviceCompatibility();
    // if (this.recommendations.length > 0) {
    const dialog = this.dialog.open(DeviceTroubleshooterComponent);
    // }
  }

  /**  */
  private async checkDeviceCompatibility() {
    this.recommendations = [];
    this.deviceInfo = await Device.getInfo();
    const { platform } = this.deviceInfo;
    const platformChecks = {
      android: () => this.runAndroidChecks(),
      web: () => this.runWebChecks(),
    };
    const platformChecker = platformChecks[platform];
    if (platformChecker) {
      platformChecker();
    } else {
      throw new Error('Compatibility service not support for platform: ' + platform);
    }
    return this.recommendations;
  }

  private runAndroidChecks() {
    // get underlying chrome/webkit version
  }
  private runWebChecks() {
    const { webViewVersion, operatingSystem, manufacturer } = this.deviceInfo;
    console.log({ webViewVersion, operatingSystem, manufacturer });
    const browserName = this.getBrowserName();
    const browserChecks: { [browserName: string]: () => void } = {
      chrome: () => {
        const version = Number(webViewVersion.split('.')[0]);
        // TODO - confirm what level of compatibility required (link to browserslist?)
        if (version < 100) {
          this.recordWarning('Your browser version is outdated, please update for an improved experience');
        }
      },
      // TODO
      firefox: () => null,
      safari: () => {
        this.recordWarning('It is recommended to use Google Chrome browser for improved experience');
      },
    };
    const browserChecker = browserChecks[browserName];
    if (browserChecker) {
      browserChecker();
    } else {
      this.recordWarning('It is recommended to use Google Chrome browser for improved experience');
      throw new Error('Compatibility service not support for browser: ' + browserName);
    }
  }

  private recordWarning(message: string, link?: string) {
    this.recommendations.push({ severity: 'warning', message, link });
  }
  private getBrowserName() {
    // TODO - could be more exact with user-agents (?)
    const { manufacturer } = this.deviceInfo;
    // NOTE - could also be edge... possibly use user agent?
    if (manufacturer.includes('Google')) return 'chrome';
    return 'unknown';
  }
}
