import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { PicsaTranslateService } from '@picsa/modules';

@Component({
  // tslint:disable component-selector
  selector: 'picsa-budget-tool',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'picsa-budget-tool';
  standalone = true;
  constructor(
    private matIconRegistry?: MatIconRegistry,
    private domSanitizer?: DomSanitizer,
    public translate?: PicsaTranslateService
  ) {
    this.registerIcons();
  }

  registerIcons() {
    const icons = {
      download: 'download',
      delete: 'delete'
    };
    for (const [key, value] of Object.entries(icons)) {
      this.matIconRegistry.addSvgIcon(
        `picsa_${key}`,
        this.domSanitizer.bypassSecurityTrustResourceUrl(
          // NOTE - svgs are imported from shared lib (see angular.json for config)
          `assets/images/${value}.svg`
        )
      );
    }
  }
}

@Component({
  // tslint:disable component-selector
  selector: 'picsa-budget-tool',
  template: ''
})
export class AppComponentEmbedded extends AppComponent {}
