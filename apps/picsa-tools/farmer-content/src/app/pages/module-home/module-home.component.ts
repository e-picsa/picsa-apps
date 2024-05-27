import { CommonModule } from '@angular/common';
import { Component, effect, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FARMER_CONTENT_DATA_BY_SLUG, IFarmerContent } from '@picsa/data';
import { FadeInOut } from '@picsa/shared/animations';
import { PicsaTranslateModule } from '@picsa/shared/modules';

@Component({
  selector: 'farmer-content-module-home',
  standalone: true,
  imports: [CommonModule, PicsaTranslateModule],
  templateUrl: './module-home.component.html',
  styleUrl: './module-home.component.scss',
  animations: [FadeInOut({ inSpeed: 200, inDelay: 100 })],
})
export class FarmerContentModuleHomeComponent {
  private params = toSignal(this.route.params);
  public content = signal<IFarmerContent | null>(null);

  constructor(private route: ActivatedRoute, private router: Router) {
    effect(
      () => {
        const { slug } = this.params() || {};
        this.loadContentBySlug(slug);
      },
      { allowSignalWrites: true }
    );
  }

  private loadContentBySlug(slug: string | undefined) {
    if (slug) {
      const content = FARMER_CONTENT_DATA_BY_SLUG[slug];
      if (content) {
        this.content.set(content);
        return;
      }
    }
    // if content not loaded simply navigate back to parent
    this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
  }
}
