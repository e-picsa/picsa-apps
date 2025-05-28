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
import { filter, map } from 'rxjs';

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
export class FarmerContentModuleHomeComponent implements OnInit, OnDestroy {
  public content = computed<IFarmerContent | undefined>(
    () => {
      const slug = this.slug();
      if (slug) {
        return FARMER_CONTENT_DATA_BY_SLUG[slug];
      }
    },
    { equal: (a, b) => a?.id === b?.id }
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
      map((e) => e.url)
    )
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private componentService: PicsaCommonComponentsService,
    private tourService: TourService
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
  }

  ngOnInit() {
    this.componentService.patchHeader({ style: 'inverted' });
  }

  ngOnDestroy() {
    this.componentService.patchHeader({ style: 'primary' });
  }

  public showTool() {
    const toolStep = this.toolStep();
    if (toolStep) {
      this.setToolUrl(toolStep.tool);
      this.toolHidden.set(false);
    }
  }

  /** When navigating to the tool tab update the url to allow the correct tool to load within a child route */
  private setToolUrl(tool: IFarmerToolData) {
    if (!location.pathname.includes(`/${tool.url}`)) {
      this.router.navigate([tool.url], { relativeTo: this.route });
    }
  }

  /**
   * Take a url like `/farmer/what-do-you-currently-do/seasonal-calendar/CFAi6NIjHzKNyBonyfha`
   * and calculate nested path segments of tool, e.g. ["","CFAi6NIjHzKNyBonyfha"]
   * Returns `[]` if no segments,  [""] on home
   * */
  private calcToolRouteSegments(url?: string, toolUrl?: string) {
    if (url && toolUrl) {
      const index: number = url.indexOf(`/${toolUrl}`);
      const toolPath = index !== -1 ? url.substring(index + toolUrl.length) : undefined;
      if (toolPath !== undefined) {
        return toolPath.split('/');
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
