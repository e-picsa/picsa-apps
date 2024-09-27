import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { FARMER_CONTENT_DATA_BY_SLUG, IFarmerContent, IFarmerContentStep, IToolData } from '@picsa/data';
import { FadeInOut } from '@picsa/shared/animations';
import { PhotoInputComponent, PhotoListComponent, PhotoViewComponent } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { TourService } from '@picsa/shared/services/core/tour';

import { FarmerStepVideoComponent } from '../../components/step-video/step-video.component';

type ITabContent = IStepTab | IReviewTab | IToolTab;

type IStepTab = { type: 'step'; data: IFarmerContentStep };
type IReviewTab = { type: 'review' };
type IToolTab = { type: 'tool'; data: IToolData };

@Component({
  selector: 'farmer-content-module-home',
  standalone: true,
  imports: [
    CommonModule,
    FarmerStepVideoComponent,
    PicsaTranslateModule,
    MatButtonModule,
    MatIconModule,
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
  public content = signal<IFarmerContent | null>(null);

  /** Content to display within mat-tabs */
  public tabs = computed(() => {
    const content = this.content();
    return this.generateContentTabs(content);
  });

  /** Selected tab index. Used to programatically change tabs from custom footer */
  public selectedIndex = signal(0);

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
    // handle loading content and fix tour implementation
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
    // handle loading tool tab if selected
    effect(() => {
      const selectedTabIndex = this.selectedIndex();
      const tabContent = this.tabs()[selectedTabIndex];
      if (tabContent) {
        if (tabContent.type === 'tool') {
          this.loadToolTab(tabContent.data);
        }
      }
    });
  }

  ngOnInit() {
    this.hideAppHeader();
  }
  ngOnDestroy() {
    this.showAppHeader();
  }

  public nextTab() {
    this.selectedIndex.update((v) => v + 1);
  }
  public previousTab() {
    this.selectedIndex.update((v) => v - 1);
  }

  private generateContentTabs(content: IFarmerContent | null) {
    const tabs: ITabContent[] = [];
    if (content) {
      const { steps, tools, showReviewSection } = content;
      for (const step of steps) {
        tabs.push({ type: 'step', data: step });
      }
      if (tools[0]) {
        tabs.push({ type: 'tool', data: tools[0] });
      }
      if (showReviewSection) {
        tabs.push({ type: 'review' });
      }
    }
    return tabs;
  }

  private hideAppHeader() {
    this.componentService.patchHeader({ hideHeader: true });
  }
  private showAppHeader() {
    this.componentService.patchHeader({ hideHeader: false });
  }

  private loadContentBySlug(slug: string | undefined) {
    if (slug) {
      const content: IFarmerContent = FARMER_CONTENT_DATA_BY_SLUG[slug];
      if (content) {
        this.content.set(content);
        return;
      }
    }
    // if content not loaded simply navigate back to parent
    this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
  }

  /** When navigating to the tool tab update the url to allow the correct tool to load within a child route */
  private loadToolTab(tool: IToolData) {
    if (!location.pathname.includes(tool.href)) {
      this.router.navigate([tool.href], { relativeTo: this.route, replaceUrl: true });
    }
  }
}
