import { TemplatePortal } from '@angular/cdk/portal';
import { Component, computed, effect, input, output, TemplateRef, viewChild, ViewContainerRef } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListItem, MatNavList } from '@angular/material/list';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { PicsaCommonComponentsModule, PicsaCommonComponentsService } from '@picsa/components';
import { ConfigurationService } from '@picsa/configuration/src';
import { APP_VERSION } from '@picsa/environments/src/version';
import { PicsaLoadingComponent } from '@picsa/shared/features/loading/loading';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { filter, map } from 'rxjs';

@Component({
  selector: 'picsa-app-layout',
  templateUrl: 'layout.html',
  styleUrl: 'layout.scss',
  imports: [
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
  showLoader = input<boolean>();
  ready = input<boolean>();
  menuButtonTemplate = viewChild.required<TemplateRef<HTMLElement>>('menuButtonTemplate');
  public drawer = viewChild.required(MatDrawer);
  public showMenuButton = toSignal(
    this.router.events.pipe(
      filter((e: any) => e instanceof NavigationEnd),
      // show sidebar on both farmer and extension home screens
      map(({ url }) => ['/farmer', '/extension'].includes(url)),
    ),
  );
  public userType = computed(() => this.configurationService.userSettings().user_type);
  public version = APP_VERSION;

  public versionClicked = output();

  constructor(
    private router: Router,
    private configurationService: ConfigurationService,
    componentService: PicsaCommonComponentsService,
    viewContainer: ViewContainerRef,
  ) {
    effect(() => {
      // Inject menu button into global header when on farmer or extension home
      const { cdkPortalStart } = componentService.headerOptions();
      if (this.showMenuButton()) {
        if (!cdkPortalStart) {
          componentService.patchHeader({
            cdkPortalStart: new TemplatePortal(this.menuButtonTemplate(), viewContainer),
          });
        }
      } else {
        if (cdkPortalStart) {
          componentService.patchHeader({ cdkPortalStart: undefined });
        }
      }
    });
  }

  public toggleUserType() {
    const targetType = this.userType() === 'extension' ? 'farmer' : 'extension';
    this.configurationService.updateUserSettings({ user_type: targetType });
    this.router.navigate(['/', targetType]);
    this.drawer().close();
  }
}
