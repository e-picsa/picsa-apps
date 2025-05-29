import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { FARMER_TOOLS_DATA } from '@picsa/data';
import { DataIconRegistry } from '@picsa/data/iconRegistry';

const TOOL_PREFIXES = FARMER_TOOLS_DATA.map((t) => t.url);

@Injectable({ providedIn: 'root' })
export class FarmerContentService {
  constructor(dataIconRegistry: DataIconRegistry) {
    dataIconRegistry.registerMatIcons('tools');
  }
  /**
   * Add support for rendering any existing page of the app within a child route.
   * This is used to show tools such as the budget tool (/budget) within a tabbed child route (/farmer/budget/budget)
   * This method should ideally be run before any pages have loaded, e.g. as part of forRoot module initialisation
   */
  public createNestedToolRoutes(router: Router) {
    const embeddedRoutes = router.config.filter((route) => {
      const prefix = route.path?.split('/')[0] as string;
      return TOOL_PREFIXES.includes(prefix as any);
    });
    router.resetConfig([
      ...router.config.map((route) => {
        // Create embedded routes for all paths except home and farmer activity pages
        // Add custom routes to identified farmer activity
        if (route.path === 'farmer/tool') {
          route.loadChildren = () => embeddedRoutes;
        }
        // tools available at both /farmer/tool debug page and content pages
        if (route.path === 'farmer/:slug') {
          route.children = embeddedRoutes;
        }
        return { ...route };
      }),
    ]);
  }
}
