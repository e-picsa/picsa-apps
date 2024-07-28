import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { FARMER_CONTENT_DATA_BY_SLUG, IFarmerContent, IFarmerContentStep, IToolData } from '@picsa/data';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ResourcesComponentsModule } from '@picsa/resources/src/app/components/components.module';
import { FadeInOut } from '@picsa/shared/animations';
import { PhotoInputComponent, PhotoListComponent,PhotoViewComponent } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { TourService } from '@picsa/shared/services/core/tour';

@Component({
  selector: 'farmer-content-module-home',
  standalone: true,
  imports: [
    CommonModule,
    PicsaTranslateModule,
    ResourcesComponentsModule,
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
export class FarmerContentModuleHomeComponent {
  private params = toSignal(this.route.params);
  public content = signal<IFarmerContent | null>(null);
  public steps = signal<IFarmerContentStep[]>([]);
  public tools = signal<IToolData[]>([]);

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
  }

  public handleTabChange(e: MatTabChangeEvent) {
    const content = this.content();
    if (content) {
      const { steps, tools } = content;
      // HACK - assume 1 tool which is last tab
      if (e.index === steps.length) {
        const [tool] = tools;
        this.loadToolTab(tool);
      }
      // HACK - clear any headers set from within tool
      else {
        this.componentService.patchHeader({ title: ' ' });
      }
    }
  }

  private loadContentBySlug(slug: string | undefined) {
    if (slug) {
      const content: IFarmerContent = FARMER_CONTENT_DATA_BY_SLUG[slug];
      if (content) {
        this.content.set(content);
        this.steps.set(content.steps);
        this.tools.set(content.tools);
        return;
      }
    }
    // if content not loaded simply navigate back to parent
    this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
  }

  /** When navigating to the tool tab update the url to allow the correct tool to load within a child route */
  private loadToolTab(tool: IToolData) {
    if (!location.pathname.endsWith(tool.href)) {
      this.router.navigate([tool.href], { relativeTo: this.route, replaceUrl: true });
    }
  }
}
