import { Component } from '@angular/core';
import { PicsaTranslateService } from '@picsa/shared/modules/translate';

@Component({
  selector: 'climate-tool',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'climate-tool';
  constructor(public translate: PicsaTranslateService) {}
}

@Component({
  selector: 'climate-tool',
  // use empty template as router outlet not required
  template: '',
  styleUrls: ['./app.component.scss'],
})
export class AppComponentEmbedded extends AppComponent {}
