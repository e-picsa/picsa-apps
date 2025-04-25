import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, model, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { FARMER_CONTENT_DATA_BY_SLUG, IFarmerContent, IFarmerContentStep, IToolData, StepTool } from '@picsa/data';
import { FadeInOut } from '@picsa/shared/animations';
import { PhotoInputComponent, PhotoListComponent, PhotoViewComponent } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { TourService } from '@picsa/shared/services/core/tour';

import { FarmerModuleFooterComponent } from './components/footer/module-footer.component';
import { FarmerStepVideoComponent } from './components/step-video/step-video.component';

interface SectionData {
  title: string;
  icon: string;
  type: string;
  index: number; // To navigate to the correct tab
}

@Component({
  selector: 'farmer-content-module-home',
  imports: [
    CommonModule,
    FarmerModuleFooterComponent,
    FarmerStepVideoComponent,
    PicsaTranslateModule,
    MatTabsModule,
    MatIconModule,
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

  /** Sections for the new layout */
  public sections = computed<SectionData[]>(() => {
    const content = this.content();
    if (!content?.steps) return [];

    return content.steps
      .map((stepGroup, index) => {
        // Find the primary content type in this step group
        // First, look for non-text blocks as they're usually more important
        const primaryBlock =
          stepGroup.find((block) => block.type === 'video' || block.type === 'tool' || block.type === 'review') ||
          stepGroup[0];

        if (!primaryBlock) return null;

        let title: string;
        let icon: string;
        const type = primaryBlock.type;

        // Set appropriate title and icon based on content type
        switch (type) {
          case 'video':
            title = index === 0 ? 'Intro Video' : 'Video';
            icon = 'play_circle';
            break;
          case 'tool':
            title = 'Interactive Tool';
            icon = 'build';
            break;
          case 'review':
            title = 'Review & Summary';
            icon = 'summarize';
            break;
          case 'text': {
            // For text blocks, use the title if available
            const textBlock: any = primaryBlock;
            title = textBlock?.title || 'Information';
            icon = 'description';
            break;
          }
          default:
            title = 'Section';
            icon = 'article';
            break;
        }

        return { title, icon, type, index };
      })
      .filter(Boolean) as SectionData[];
  });

  public updateSelectedIndex(index: number) {
    this.selectedIndex.set(index);
  }

  public stepIcons = {
    video: 'play_circle',
    tool: 'build',
    review: 'summarize',
    text: 'description',
  };

  /** Selected tab index. Used to programatically change tabs from custom footer */
  public selectedIndex = model(0);

  /** Track whether tool is active in mat-stepper  */
  public toolTabIndex = signal(-1);

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
    effect((onCleanup) => {
      const { slug } = this.params() || {};
      this.loadContentBySlug(slug);
      // update the tour service to allow triggering tour from inside mat-tab component
      this.tourService.useInMatTab = true;
      onCleanup(() => {
        this.tourService.useInMatTab = false;
      });
    });
    // If tool tab selected handle side-effects (routing and header)
    effect(() => {
      const selectedTabIndex = this.selectedIndex();
      const contentBlocks = this.tabs()[selectedTabIndex];
      this.handleContentChangeEffects(contentBlocks);
    });
  }

  ngOnInit() {
    this.componentService.patchHeader({ hideHeader: true, hideBackButton: true, style: 'inverted' });
    this.route.fragment.subscribe((fragment) => {
      if (fragment) {
        const tabIndex = this.findTabIndexByType(fragment);
        if (tabIndex !== -1) {
          this.selectedIndex.set(tabIndex);
        }
      }
    });
  }

  ngOnDestroy() {
    this.componentService.patchHeader({ hideHeader: false, hideBackButton: false, style: 'primary' });
  }

  private findTabIndexByType(type: string): number {
    const tabs = this.tabs();
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i].some((block) => block.type === type)) {
        return i;
      }
    }
    return -1;
  }

  /** Handle tool routing and header changes when stepper content changed */
  private handleContentChangeEffects(stepContent: IFarmerContentStep[]) {
    const toolBlock = stepContent.find((b) => b.type === 'tool') as StepTool | undefined;
    if (toolBlock) {
      this.toolTabIndex.set(this.selectedIndex());
      this.setToolUrl(toolBlock.tool);
    }
    // toggle app header if required by tool
    const hideHeader = toolBlock?.tool?.showHeader ? false : true;
    if (this.componentService.headerOptions().hideHeader !== hideHeader) {
      this.componentService.patchHeader({ hideHeader, hideBackButton: hideHeader ? true : false });
    }
    // show back button in tools that have nested route
    const hideBackButton = this.shouldHideBackButton(toolBlock?.tool);
    if (this.componentService.headerOptions().hideBackButton !== hideBackButton) {
      this.componentService.patchHeader({ hideBackButton });
    }
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
  private setToolUrl(tool: IToolData) {
    if (!location.pathname.includes(`/${tool.href}`)) {
      this.router.navigate([tool.href], { relativeTo: this.route, replaceUrl: true });
    }
  }

  private shouldHideBackButton(tool?: IToolData) {
    if (tool) {
      // HACK - budget tool doesn't show back to site select as can be done from dropdown
      if (location.pathname.includes(`/climate`)) return true;
      // default hide back button on tool home page, e.g. `/farmer/module/budget`
      // but include on nested pages, e.g. `/farmer/module/budget`
      return location.pathname.endsWith(`/${tool.href}`);
    }
    return true;
  }

  public navigateToSection(index: number) {
    this.selectedIndex.set(index);
  }

  public getSectionIcon(type: string): string {
    return this.stepIcons[type as keyof typeof this.stepIcons] || 'article';
  }
}
