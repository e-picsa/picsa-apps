import { inject, NgModule } from '@angular/core';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  CanActivateFn,
  PreloadAllModules,
  Router,
  RouterModule,
  RouterStateSnapshot,
  Routes,
} from '@angular/router';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { ClimateDataService } from './services/climate-data.service';

/** Use a custom canActivate guard to handle auto-redirecting to site if a user loads the default siteSelect page */
const shouldShowSiteSelect: CanActivateFn = async (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  // dynamically inject services required to evaluated
  const dataService = inject(ClimateDataService);
  const router = inject(Router);
  const activatedRoute = inject(ActivatedRoute);

  // If preferred station saved redirect to that station and block loading the site select page
  const station_id = dataService.getPreferredStation();
  if (station_id) {
    router.navigate([state.url, station_id], {
      queryParams: { view: 'rainfall' },
      relativeTo: activatedRoute,
    });
    return false;
  }
  // otherwise allow the site select page to load
  return true;
};

export const ROUTES_COMMON: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/site-select/site-select.page').then((mod) => mod.SiteSelectPage),
    title: translateMarker('Select a site'),
    canActivate: [shouldShowSiteSelect],
  },
  {
    path: ':siteId',
    loadChildren: () => import('./pages/site-view/site-view.module').then((mod) => mod.ClimateSiteViewPageModule),
    data: {
      headerStyle: 'inverted',
    },
  },
];
/** Routes only registered in standalone mode */
const ROUTES_STANDALONE: Routes = [{ path: '**', redirectTo: '' }];

/*******************************************************************
 *  Standalone Version
 ******************************************************************/
@NgModule({
  imports: [
    RouterModule.forRoot([...ROUTES_COMMON, ...ROUTES_STANDALONE], {
      preloadingStrategy: PreloadAllModules,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
