import { Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TOOLS_DATA } from '@picsa/data';
import { filter, map } from 'rxjs';

@Component({
  selector: 'farmer-content-tool',
  template: `
    <div class="page">
      @if(!toolId()){
      <!-- Tools List -->
      <div class="page-content">
        @for(tool of tools; track tool.id){
        <div>
          <a [routerLink]="tool.href">{{ tool.label }}</a>
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
  public tools = TOOLS_DATA;

  public toolId = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => {
        const toolId = (e as NavigationEnd).url.split('/').pop();
        return toolId !== 'tool' ? toolId : '';
      })
    )
  );
  constructor(private router: Router) {}
}
