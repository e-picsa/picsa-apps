import { CommonModule } from '@angular/common';
import { Component, computed, Input, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListItem, MatNavList } from '@angular/material/list';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { ConfigurationService } from '@picsa/configuration/src';
import { APP_VERSION } from '@picsa/environments';
import { PicsaLoadingComponent } from '@picsa/shared/features/loading/loading';
import { PicsaTranslateModule } from '@picsa/shared/modules';
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
    MatNavList,
    MatListItem,
    RouterOutlet,
    RouterModule,
    PicsaLoadingComponent,
    PicsaCommonComponentsModule,
    PicsaTranslateModule,
  ],
})
export class AppLayoutComponent {
  @Input() showLoader: boolean;
  @Input() ready: boolean;
  public drawer = viewChild.required(MatDrawer);
  public showMenuButton = toSignal(
    this.router.events.pipe(
      filter((e: any) => e instanceof NavigationEnd),
      // show sidebar on both farmer and extension home screens
      map(({ url }) => ['/farmer', '/extension'].includes(url))
    )
  );
  public userType = computed(() => this.configurationService.userSettings().user_type);
  public version = APP_VERSION;

  constructor(private router: Router, private configurationService: ConfigurationService) {}

  public toggleUserType() {
    const targetType = this.userType() === 'extension' ? 'farmer' : 'extension';
    this.configurationService.updateUserSettings({ user_type: targetType });
    this.router.navigate(['/', targetType]);
    this.drawer().close();
  }
}
