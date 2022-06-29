import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  // tslint:disable component-selector
  selector: 'picsa-dashboard',
  template: `
    <router-outlet></router-outlet>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'picsa-dashboard';
  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    this.registerIcons();
  }

  // register custom icons from the assets/images/icons folder for access within the app
  // icons can be accessed in mat-icon as svgIcon='station_data_${key}'
  registerIcons() {
    const icons = {
      add_data: 'add_data',
      map: 'map'
    };
    for (const [key, value] of Object.entries(icons)) {
      console.log('adding icon', key, value);
      this.matIconRegistry.addSvgIcon(
        `station_data_${key}`,
        this.domSanitizer.bypassSecurityTrustResourceUrl(
          `assets/images/icons/${value}.svg`
        )
      );
    }
  }
}
