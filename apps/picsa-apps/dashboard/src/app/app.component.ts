import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { DashboardMaterialModule } from './material.module';

@Component({
  standalone: true,
  imports: [RouterModule, DashboardMaterialModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'picsa-apps-dashboard';
}
