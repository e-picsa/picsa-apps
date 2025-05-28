import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { BackButton, PicsaCommonComponentsService } from '@picsa/components/src';
import { FARMER_CONTENT_DATA_BY_SLUG, IFarmerContent, IFarmerToolData } from '@picsa/data';
import { FadeInOut, FlyInOut } from '@picsa/shared/animations';
import { PhotoInputComponent, PhotoListComponent } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { TourService } from '@picsa/shared/services/core/tour';
import { isEqual } from '@picsa/utils/object.utils';
import { filter, map, Subscription } from 'rxjs';

import { FarmerModuleFooterComponent } from './components/footer/module-footer.component';
import { FarmerStepVideoComponent } from './components/step-video/step-video.component';

@Component({
  selector: 'farmer-content-module-home',
  imports: [
    CommonModule,
    BackButton,
    FarmerModuleFooterComponent,
    FarmerStepVideoComponent,
    PicsaTranslateModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    PhotoInputComponent,
    PhotoListComponent,
    RouterModule,
  ],
  templateUrl: './module-home.component.html',
  styleUrl: './module-home.component.scss',
  animations: [FadeInOut({ inSpeed: 200, inDelay: 100 }), FlyInOut({ axis: 'Y' })],
  // Ensure url changes update in nested tools by using default change detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class FarmerContentModuleHomeComponent implements OnDestroy {
  public content = computed<IFarmerContent | undefined>(
    () => {
      const slug = this.slug();
      if (slug) {
        return FARMER_CONTENT_DATA_BY_SLUG[slug];
      }
    },
    { equal: (a, b) => a?.id === b?.id },
  );

  public toolStep = computed(() => this.content()?.steps.find((v) => v.type === 'tool'));

  /** Route segments of nested tool router */
  public toolRouteSegments = computed(() => this.calcToolRouteSegments(this.url(), this.toolStep()?.tool.url), {
    equal: isEqual,
  });

  /** Manually show/hide tool */
  public toolHidden = signal(false);

  /** Store any user-generated photos within a folder named after module */
  public photoAlbum = computed(() => {
    const content = this.content();
    if (content) {
      return `farmer-activity/${content.id}`;
    }
    return undefined;
  });

  private slug = toSignal(this.route.params.pipe(map((params) => params.slug)));

  private url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.url),
    ),
  );

  /** Utility used to intercept nav back events when tool hidden but in routable state */
  private backEventInterceptor: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private componentService: PicsaCommonComponentsService,
    private tourService: TourService,
  ) {
    effect(() => {
      const content = this.content();
      if (content) {
        this.componentService.patchHeader({ title: content.title });
      } else {
        // If content not loaded simply navigate back to parent.
        this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
      }
    });

    // load content on slug change
    effect(() => {
      const content = this.content();
      if (content) {
        this.componentService.patchHeader({ title: content.title });
      }
    });

    // update the tour service to allow triggering tour from inside mat-tab component
    effect((onCleanup) => {
      this.tourService.useInMatTab = true;
      onCleanup(() => {
        this.tourService.useInMatTab = false;
      });
    });
    // HACK - revert any changes to header style that tool might impose
    effect(() => {
      const segments = this.toolRouteSegments();
      if (segments.length === 0) {
        this.componentService.patchHeader({ style: 'inverted' });
      }
    });
  }

  ngOnDestroy() {
    this.componentService.patchHeader({ style: 'primary' });
    if (this.backEventInterceptor) {
      this.backEventInterceptor.unsubscribe();
    }
  }

  public showTool() {
    const toolStep = this.toolStep();
    if (toolStep) {
      const { tool } = toolStep;
      // When navigating to the tool tab update the url to allow the correct tool to load within a child route
      if (!location.pathname.includes(`/${tool.url}`)) {
        this.router.navigate([tool.url], { relativeTo: this.route, replaceUrl: true });
      }
      this.toolHidden.set(false);
    }
  }

  /** Hide the currently open tool but keep its active routing state so that it can be shown again */
  public hideTool() {
    const toolStep = this.toolStep();
    if (toolStep) {
      this.toolHidden.set(true);
      this.setupBackNavigationInterceptor();
    }
  }

  /**
   * HACK - when tool closed it retains route, so if containing nested routes main page back button will handle back
   * nav within the tool (not seen by user). As a workaround trigger additional `back` button press if required
   */
  private setupBackNavigationInterceptor() {
    if (this.toolRouteSegments().length > 1) {
      if (this.backEventInterceptor) {
        this.backEventInterceptor.unsubscribe();
      }
      const navEndEvents = this.router.events.pipe(filter((e) => e instanceof NavigationEnd));
      this.backEventInterceptor = navEndEvents.subscribe(() => {
        if (this.toolRouteSegments().length > 0) {
          this.componentService.back();
        }
      });
    }
  }

  /**
   * Take a url like `/farmer/what-do-you-currently-do/seasonal-calendar/CFAi6NIjHzKNyBonyfha`
   * and calculate nested path segments of tool, e.g. ["","CFAi6NIjHzKNyBonyfha"]
   * Returns `[]` if no segments,  [""] on home
   * */
  private calcToolRouteSegments(url?: string, toolUrl?: string) {
    if (url && toolUrl) {
      if (url.includes(`/${toolUrl}`)) {
        const [before, after] = url.split(`/${toolUrl}`);
        const segments = after.split('/');
        return segments;
      }
    }
    return [];
  }

  // TODO - review if needed
  private shouldHideBackButton(tool?: IFarmerToolData) {
    if (tool) {
      // HACK - budget tool doesn't show back to site select as can be done from dropdown
      if (location.pathname.includes(`/climate`)) return true;
      // default hide back button on tool home page, e.g. `/farmer/module/budget`
      // but include on nested pages, e.g. `/farmer/module/budget`
      return location.pathname.endsWith(`/${tool.url}`);
    }
    return true;
  }
}
