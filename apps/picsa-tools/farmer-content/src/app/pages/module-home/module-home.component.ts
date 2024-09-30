import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, model, OnDestroy, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { FARMER_CONTENT_DATA_BY_SLUG, IFarmerContent, IToolData } from '@picsa/data';
import { FadeInOut } from '@picsa/shared/animations';
import { PhotoInputComponent, PhotoListComponent, PhotoViewComponent } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { TourService } from '@picsa/shared/services/core/tour';

import { FarmerModuleFooterComponent } from './components/footer/module-footer.component';
import { FarmerStepVideoComponent } from './components/step-video/step-video.component';

@Component({
  selector: 'farmer-content-module-home',
  standalone: true,
  imports: [
    CommonModule,
    FarmerModuleFooterComponent,
    FarmerStepVideoComponent,
    PicsaTranslateModule,
    MatTabsModule,
    PhotoInputComponent,
    PhotoViewComponent,
    RouterOutlet,
    PhotoListComponent,
  ],
  templateUrl: './module-home.component.html',
  styleUrl: './module-home.component.scss',
  animations: [FadeInOut({ inSpeed: 200, inDelay: 100 })],
  // Ensure url changes update in nested tools by using default change detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class FarmerContentModuleHomeComponent implements OnInit, OnDestroy {
  private params = toSignal(this.route.params);

  public content = computed<IFarmerContent | undefined>(() => {
    const { slug } = this.params() || {};
    return this.loadContentBySlug(slug);
  });

  /** Content to display within mat-tabs */
  public tabs = computed(() => {
    const content = this.content();
    return content?.steps || [];
  });

  /** Selected tab index. Used to programatically change tabs from custom footer */
  public selectedIndex = model(0);

  /** Store any user-generated photos within a folder named after module */
  public photoAlbum = computed(() => {
    const content = this.content();
    if (content) {
      return `farmer-activity/${content.id}`;
    }
    return undefined;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private componentService: PicsaCommonComponentsService,
    private tourService: TourService
  ) {
    // load content on slug change and fix tour implementation
    effect(
      (onCleanup) => {
        const { slug } = this.params() || {};
        this.loadContentBySlug(slug);
        // update the tour service to allow triggering tour from inside mat-tab component
        this.tourService.useInMatTab = true;
        onCleanup(() => {
          this.tourService.useInMatTab = false;
        });
      },
      { allowSignalWrites: true }
    );
    // If tool tab selected handle side-effects
    effect(() => {
      const selectedTabIndex = this.selectedIndex();
      const contentBlocks = this.tabs()[selectedTabIndex];
      const toolBlock = contentBlocks.find((b) => b.type === 'tool');
      if (toolBlock) {
        this.loadToolTab((toolBlock as any).tool);
      }
    });
  }

  ngOnInit() {
    this.componentService.patchHeader({ hideHeader: true });
  }
  ngOnDestroy() {
    this.componentService.patchHeader({ hideHeader: false });
  }

  private loadContentBySlug(slug: string | undefined) {
    if (slug) {
      const content: IFarmerContent = FARMER_CONTENT_DATA_BY_SLUG[slug];
      if (content) {
        return content;
      }
    }
    // If content not loaded simply navigate back to parent.
    this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
    return undefined;
  }

  /** When navigating to the tool tab update the url to allow the correct tool to load within a child route */
  private loadToolTab(tool: IToolData) {
    if (!location.pathname.includes(`/${tool.href}`)) {
      this.router.navigate([tool.href], { relativeTo: this.route, replaceUrl: true });
    }
  }
}
