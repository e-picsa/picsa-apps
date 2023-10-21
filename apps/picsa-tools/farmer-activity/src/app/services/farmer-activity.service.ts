import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class FarmerActivityService {
  /**
   * Add support for rendering any existing page of the app within a child route.
   * This is used to show tools such as the budget tool (/budget) within a tabbed child route (/farmer-activity/budget/budget)
   * This method should ideally be run before any pages have loaded, e.g. as part of forRoot module initialisation
   */
  public createNestedToolRoutes(router: Router) {
    router.resetConfig([
      ...router.config.map((route) => {
        // Create embedded routes for all paths except home and farmer activity pages
        const embeddedRoutes = [
          ...router.config.filter((route) => route.path !== 'farmer-activity/:id' && route.path !== ''),
        ];
        // Add custom routes to identified farmer activity
        if (route.path === 'farmer-activity/:id') {
          route.children = [...embeddedRoutes];
        }
        return { ...route };
      }),
    ]);
  }
}
