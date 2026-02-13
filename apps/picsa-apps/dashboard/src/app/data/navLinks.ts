import { AdminFeature } from '../modules/admin/admin.routes';
import { ClimateFeature } from '../modules/climate/climate.routes';
import { CropFeature } from '../modules/crop-information/crop.routes';
import { DeploymentFeature } from '../modules/deployment/deployment.routes';
import { HomeFeature } from '../modules/home/home.routes';
import { MonitoringFeature } from '../modules/monitoring/monitoring.routes';
import { ResourcesFeature } from '../modules/resources/resources.routes';
import { StatsFeature } from '../modules/stats/stats.routes';
import { TranslationsFeature } from '../modules/translations/translations.routes';
import { INavLink } from '../utils/route-utils';

export const DASHBOARD_NAV_LINKS: INavLink[] = [
  ...HomeFeature.NAV_LINKS,
  ...ClimateFeature.NAV_LINKS,
  ...CropFeature.NAV_LINKS,
  ...MonitoringFeature.NAV_LINKS,
  ...TranslationsFeature.NAV_LINKS,
  ...ResourcesFeature.NAV_LINKS,
];

export const ADMIN_NAV_LINKS: INavLink[] = [
  ...StatsFeature.NAV_LINKS,
  ...DeploymentFeature.NAV_LINKS,
  ...AdminFeature.NAV_LINKS,
];

export const PUBLIC_PAGES = ['privacy-policy', 'terms-of-service', 'profile/password-reset'];
