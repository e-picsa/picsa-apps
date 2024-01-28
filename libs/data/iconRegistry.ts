import { MatIconRegistry } from '@angular/material/icon';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { CROP_ACTIVITY_DATA } from './crop_activity';
import { WEATHER_DATA } from './weather';
import { CROPS_DATA } from './crops';
import { IPicsaDataWithIcons } from './models';

/** List of datasets that include icons for registration */
export const ICON_PACK_DATA: Record<string, IPicsaDataWithIcons[]> = {
  crop_activity: CROP_ACTIVITY_DATA,
  crops: CROPS_DATA,
  weather: WEATHER_DATA,
};
export type IconPackName = keyof typeof ICON_PACK_DATA;

@Injectable({ providedIn: 'root' })
export class DataIconRegistry {
  private registeredIcons: Record<string, boolean> = {};
  constructor(private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) {}

  public registerMatIcons(iconPack: IconPackName) {
    // Avoid re-registering by checking if first matIcon has already been registered
    if (this.registeredIcons[iconPack]) return;
    const entries = ICON_PACK_DATA[iconPack];
    for (const { svgIcon, assetIconPath } of entries) {
      // make icons available within corresponding namespace, e.g. weather icons will be prefixed `picsa_weather:`
      this.matIconRegistry.addSvgIconInNamespace(
        `picsa_${iconPack}`,
        svgIcon,
        this.domSanitizer.bypassSecurityTrustResourceUrl(assetIconPath)
      );
    }
    this.registeredIcons[iconPack] = true;
    this.checkIconAssetsImported(iconPack);
  }

  /**
   * Check whether a registered icon can be retrieved
   * Prompting error to import missing assets from if missing
   **/
  private checkIconAssetsImported(iconPack: IconPackName) {
    const [{ svgIcon }] = ICON_PACK_DATA[iconPack];
    const namespace = `picsa_${iconPack}`;
    this.matIconRegistry.getNamedSvgIcon(svgIcon, namespace).subscribe({
      error: (err) => {
        const exampleImport = `\n\n{"glob": "*.svg", "input": "libs/data/${iconPack}/svgs","output": "assets/svgs/${iconPack}"}\n\n`;
        throw new Error(
          `Failed to retrieve icon ${namespace}:${svgIcon}\nensure imported into app project.json ${exampleImport}`
        );
      },
    });
  }
}
