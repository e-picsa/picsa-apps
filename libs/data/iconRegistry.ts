import { MatIconRegistry } from '@angular/material/icon';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { CROP_ACTIVITY_DATA } from './crop_activity';
import { WEATHER_DATA } from './weather';

/** List of datasets that include icons for registration */
const IconPacks = {
  crop_activity: CROP_ACTIVITY_DATA,
  weather: WEATHER_DATA,
};

@Injectable({ providedIn: 'root' })
export class DataIconRegistry {
  private registeredIcons: Record<string, boolean> = {};
  constructor(private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) {}

  public registerMatIcons(iconPack: keyof typeof IconPacks) {
    // Avoid re-registering by checking if first matIcon has already been registered
    if (this.registeredIcons[iconPack]) return;
    const entries = IconPacks[iconPack];
    for (const { svgIcon, assetIconPath } of entries) {
      this.matIconRegistry.addSvgIcon(svgIcon, this.domSanitizer.bypassSecurityTrustResourceUrl(assetIconPath));
    }
    this.registeredIcons[iconPack] = true;
    this.checkIconAssetsImported(iconPack);
  }

  /**
   * Check whether a registered icon can be retrieved
   * Prompting error to import missing assets from shared-assets if missing
   **/
  private checkIconAssetsImported(iconPack: keyof typeof IconPacks) {
    const [{ svgIcon }] = IconPacks[iconPack];
    console.log('check icon', svgIcon);
    this.matIconRegistry.getNamedSvgIcon(svgIcon).subscribe({
      error: (err) => {
        const exampleImport = `\n\n{"glob": "*.svg", "input": "libs/data/${iconPack}/svgs","output": "assets/svgs/${iconPack}"}\n\n`;
        throw new Error('Data icons not registered, ensure imported into app project.json' + exampleImport);
      },
    });
  }
}
