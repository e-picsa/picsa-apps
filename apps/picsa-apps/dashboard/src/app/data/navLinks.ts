import { AdminFeature } from '../modules/admin/admin.routes';
import { ClimateFeature } from '../modules/climate/climate.routes';
import { CropFeature } from '../modules/crop-information/crop.routes';
import { MonitoringFeature } from '../modules/monitoring/monitoring.routes';
import { INavLink } from '../utils/route-utils';

export const DASHBOARD_NAV_LINKS: INavLink[] = [
  {
    label: 'Home',
    href: '/home',
    matIcon: 'home',
  },
  {
    label: 'Resources',
    href: '/resources',
    matIcon: 'library_books',
    children: [
      {
        label: 'Files',
        href: '/files',
      },
      {
        label: 'Links',
        href: '/links',
      },
      {
        label: 'Collections',
        href: '/collections',
      },
    ],
  },
  ...(ClimateFeature.NAV_LINK ? [ClimateFeature.NAV_LINK] : []),
  ...(CropFeature.NAV_LINK ? [CropFeature.NAV_LINK] : []),
  ...(MonitoringFeature.NAV_LINK ? [MonitoringFeature.NAV_LINK] : []),
  {
    label: 'Translations',
    href: '/translations',
    matIcon: 'translate',
    children: [
      {
        label: 'List',
        href: '/list',
      },
      {
        label: 'Import',
        href: '/import',
      },
    ],
  },
];

export const ADMIN_NAV_LINKS: INavLink[] = [
  {
    label: 'Statistics',
    href: '/stats',
    matIcon: 'query_stats',
  },
  {
    label: 'Deployments',
    href: '/deployment',
    matIcon: 'apps',
    roleRequired: 'deployments.admin',
  },
  ...AdminFeature.HOISTED_LINKS,
];

export const PUBLIC_PAGES = ['privacy-policy', 'terms-of-service'];
