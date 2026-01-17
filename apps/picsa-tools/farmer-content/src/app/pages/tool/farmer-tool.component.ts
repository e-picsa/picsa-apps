import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { FARMER_TOOLS_DATA } from '@picsa/data';
import { filter, map } from 'rxjs';

@Component({
  selector: 'farmer-content-tool',
  template: `
    <div class="page">
      @if (!toolId()) {
        <!-- Tools List -->
        <div class="page-content">
          @for (tool of tools; track tool.id) {
            <div>
              <a [routerLink]="tool.url">{{ tool.label }}</a>
            </div>
          }
        </div>
      }
      <!-- Tool View -->
      <router-outlet></router-outlet>
    </div>
  `,
  standalone: false,
})
export class FarmerToolPlaceholderComponent {
  private router = inject(Router);

  public tools = FARMER_TOOLS_DATA;

  public toolId = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => {
        const toolId = (e as NavigationEnd).url.split('/').pop();
        return toolId !== 'tool' ? toolId : '';
      }),
    ),
  );
}
