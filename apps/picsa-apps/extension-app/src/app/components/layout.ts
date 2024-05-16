import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaLoadingComponent } from '@picsa/shared/features/loading/loading';
import { filter, map } from 'rxjs';

@Component({
  selector: 'picsa-app-layout',
  templateUrl: 'layout.html',
  styleUrl: 'layout.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    RouterOutlet,
    PicsaLoadingComponent,
    PicsaCommonComponentsModule,
  ],
})
export class AppLayoutComponent {
  @Input() showLoader: boolean;
  @Input() ready: boolean;
  public showMenuButton = toSignal(
    this.router.events.pipe(
      filter((e: any) => e instanceof NavigationEnd),
      // only show sidebar on farmer home
      map(({ url }) => ['/farmer'].includes(url))
    )
  );

  constructor(private router: Router) {}
}
