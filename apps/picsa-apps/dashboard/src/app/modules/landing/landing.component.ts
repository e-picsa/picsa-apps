import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { APP_VERSION } from '@picsa/environments/src/version';

import { DashboardSignInComponent } from '../auth/components/sign-in/sign-in.component';

@Component({
  selector: 'dashboard-landing-page',
  standalone: true,
  imports: [ReactiveFormsModule, DashboardSignInComponent, MatCardModule, MatToolbarModule, MatButtonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {
  appVersion = APP_VERSION;
}
