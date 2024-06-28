import { CommonModule } from '@angular/common';
import { Component, effect, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { FARMER_CONTENT_DATA_BY_SLUG, IFarmerContent, IFarmerContentStep } from '@picsa/data';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ResourcesComponentsModule } from '@picsa/resources/src/app/components/components.module';
import { FadeInOut } from '@picsa/shared/animations';
import { PicsaTranslateModule } from '@picsa/shared/modules';

@Component({
  selector: 'farmer-content-module-home',
  standalone: true,
  imports: [CommonModule, PicsaTranslateModule, ResourcesComponentsModule, MatTabsModule],
  templateUrl: './module-home.component.html',
  styleUrl: './module-home.component.scss',
  animations: [FadeInOut({ inSpeed: 200, inDelay: 100 })],
})
export class FarmerContentModuleHomeComponent {
  private params = toSignal(this.route.params);
  public content = signal<IFarmerContent | null>(null);
  public steps = signal<IFarmerContentStep[]>([]);

  constructor(private route: ActivatedRoute, private router: Router) {
    effect(
      () => {
        const { slug } = this.params() || {};
        this.loadContentBySlug(slug);
      },
      { allowSignalWrites: true }
    );
  }

  public handleTabChange(e) {
    console.log('tab change', e);
  }

  private loadContentBySlug(slug: string | undefined) {
    if (slug) {
      const content: IFarmerContent = FARMER_CONTENT_DATA_BY_SLUG[slug];
      if (content) {
        this.content.set(content);
        this.steps.set(content.steps);
        console.log('content', content);
        return;
      }
    }
    // if content not loaded simply navigate back to parent
    this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
  }
}
