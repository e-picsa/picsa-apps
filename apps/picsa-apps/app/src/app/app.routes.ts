import { Routes } from '@angular/router';

import { APP_ROUTES } from './routes/app-routes';
import { TOOL_ROUTES } from './routes/tool-routes';

export const appRoutes: Routes = [
  ...APP_ROUTES.filter((r) => r.path !== 'farmer'),
  {
    path: 'farmer',
    // eslint-disable-next-line @nx/enforce-module-boundaries
    loadChildren: () =>
      import('@picsa/farmer-content/src/app/app.routes').then((m) => m.buildFarmerRoutes(TOOL_ROUTES)),
    title: 'PICSA',
  },
  ...TOOL_ROUTES,
];
