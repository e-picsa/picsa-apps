import { Component, inject } from '@angular/core';
import { PicsaTranslateService } from '@picsa/i18n';

@Component({
  selector: 'climate-tool',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent {
  translate = inject(PicsaTranslateService);

  title = 'climate-tool';
}

@Component({
  selector: 'climate-tool',
  // use empty template as router outlet not required
  template: '',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponentEmbedded extends AppComponent {}
