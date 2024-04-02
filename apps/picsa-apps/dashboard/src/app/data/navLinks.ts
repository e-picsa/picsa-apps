import { IAuthRole } from '@picsa/shared/services/core/supabase/services/supabase-auth.service';

export interface INavLink {
  label: string;
  href: string;
  matIcon?: string;
  children?: INavLink[];
  roleRequired?: IAuthRole;
}

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
  },
  {
    label: 'Climate',
    href: '/climate',
    matIcon: 'filter_drama',
    children: [
      {
        label: 'Station Data',
        href: '/station',
      },
      {
        label: 'Forecasts',
        href: '/forecast',
      },
    ],
  },
  {
    label: 'Crop Information',
    href: '/crop-information',
    matIcon: 'spa',
  },
  {
    label: 'Monitoring Forms',
    href: '/monitoring',
    matIcon: 'poll',
  },
  {
    label: 'Translations',
    href: '/translations',
    matIcon: 'translate',
  },
];

export const GLOBAL_NAV_LINKS: INavLink[] = [
  {
    label: 'Deployments',
    href: '/deployment',
    matIcon: 'apps',
    roleRequired: 'deployments.admin',
  },
];
