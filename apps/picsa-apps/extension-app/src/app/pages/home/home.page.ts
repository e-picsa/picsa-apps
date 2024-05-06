import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ConfigurationService } from '@picsa/configuration';

@Component({
  selector: 'picsa-app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  constructor(public configurationService: ConfigurationService) {}
}
