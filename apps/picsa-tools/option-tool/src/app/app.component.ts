import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';


@Component({
  selector: 'option-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'picsa-tools-option-tool';
 
  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    this.registerIcons();
  }
   // register custom icons from the assets/svgs folder for access within the app
  // icons can be accessed in mat-icon as svgIcon='station_data_${key}'
  registerIcons() {
    const icons = {
      female: 'female',
      male: 'male'
    };
    for (const [key, value] of Object.entries(icons)) {
      const iconName = `picsa_options_${key}`;
      const iconUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(
        `assets/svgs/${value}.svg`
      );
      this.matIconRegistry.addSvgIcon(iconName, iconUrl);
    }
  }
 
}
