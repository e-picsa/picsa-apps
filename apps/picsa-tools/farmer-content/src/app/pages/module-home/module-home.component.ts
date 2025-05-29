import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { BackButton, PicsaCommonComponentsService } from '@picsa/components/src';
import { FARMER_CONTENT_DATA, FARMER_CONTENT_DATA_BY_SLUG, IFarmerContent } from '@picsa/data';
import { FadeInOut, FlyInOut } from '@picsa/shared/animations';
import { PhotoInputComponent, PhotoListComponent } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { _wait } from '@picsa/utils';
import { isEqual } from '@picsa/utils/object.utils';
import { filter, map } from 'rxjs';

import { FarmerStepVideoComponent } from './components/step-video/step-video.component';

@Component({
  selector: 'farmer-content-module-home',
  imports: [
    CommonModule,
    BackButton,
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
  public toolHidden = signal(true);

  /** Store any user-generated photos within a folder named after module */
  public photoAlbum = computed(() => {
    const content = this.content();
    if (content) {
      return `farmer-activity/${content.id}`;
    }
    return undefined;
  });

  public nextModule = computed(() => {
    const content = this.content();
    if (content) {
      const { id } = content;
      const currentIndex = FARMER_CONTENT_DATA.findIndex((v) => v.id === id);
      return FARMER_CONTENT_DATA[currentIndex + 1];
    }
    return undefined;
  });

  /** Manually trigger content fade by setting signal (used when changing modules dynamically) */
  public fadeInContent = signal(true);

  private contentEl = viewChild.required<ElementRef<HTMLDivElement>>('contentEl');

  private slug = toSignal(this.route.params.pipe(map((params) => params.slug)));

  private url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.url),
    ),
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private componentService: PicsaCommonComponentsService,
  ) {
    effect(() => {
      const content = this.content();
      if (!content) {
        // If content not loaded simply navigate back to parent.
        this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
      }
    });

    // Hide regular header when tool not in view (avoid conflicting local and tool headers)
    effect(() => {
      const hideHeader = this.toolHidden() || this.toolRouteSegments().length === 0;
      this.componentService.patchHeader({ hideHeader });
    });
  }

  ngOnDestroy() {
    this.componentService.patchHeader({ hideHeader: false });
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
    }
  }

  public async goToModule(module: IFarmerContent) {
    // fade out previous content before loading next module and fading back in
    this.fadeInContent.set(false);
    await _wait(100);
    this.router.navigate(['farmer', module.slug], { replaceUrl: true });
    this.contentEl().nativeElement.scrollTo({ top: 0, behavior: 'instant' });
    await _wait(100);
    this.fadeInContent.set(true);
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
}
