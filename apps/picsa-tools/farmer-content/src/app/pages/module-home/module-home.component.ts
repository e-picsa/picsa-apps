import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { FARMER_CONTENT_DATA_BY_SLUG, IFarmerContent, IFarmerContentStep, IToolData } from '@picsa/data';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ResourcesComponentsModule } from '@picsa/resources/src/app/components/components.module';
import { FadeInOut } from '@picsa/shared/animations';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { TourService } from '@picsa/shared/services/core/tour';

@Component({
  selector: 'farmer-content-module-home',
  standalone: true,
  imports: [CommonModule, PicsaTranslateModule, ResourcesComponentsModule, MatTabsModule, RouterOutlet],
  templateUrl: './module-home.component.html',
  styleUrl: './module-home.component.scss',
  animations: [FadeInOut({ inSpeed: 200, inDelay: 100 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerContentModuleHomeComponent {
  private params = toSignal(this.route.params);
  public content = signal<IFarmerContent | null>(null);
  public steps = signal<IFarmerContentStep[]>([]);
  public tools = signal<IToolData[]>([]);

  constructor(private route: ActivatedRoute, private tourService: TourService, private router: Router) {
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
    // TODO - handle tool loading for case of multiple
  }

  private loadContentBySlug(slug: string | undefined) {
    if (slug) {
      const content: IFarmerContent = FARMER_CONTENT_DATA_BY_SLUG[slug];
      if (content) {
        this.content.set(content);
        this.steps.set(content.steps);
        this.tools.set(content.tools);
        const [tool] = content.tools;
        // HACK - assuming only 1 tool in use can include in url immediately
        // Otherwise may have to use tab change event
        if (tool) {
          this.loadToolTab(tool);
        }
        return;
      }
    }
    // if content not loaded simply navigate back to parent
    this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
  }

  /** When navigating to the tool tab update the url to allow the correct tool to load within a child route */
  private loadToolTab(tool: IToolData) {
    this.router.navigate([tool.href], { relativeTo: this.route, replaceUrl: true });
  }
}
