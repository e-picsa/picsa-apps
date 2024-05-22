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
    children: [
      {
        label: 'Collections',
        href: '/collections',
      },
      {
        label: 'Files',
        href: '/files',
      },
      {
        label: 'Links',
        href: '/links',
      },
    ],
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
    label: 'Crop',
    href: '/crop',
    matIcon: 'spa',
    children: [
      {
        label: 'Variety',
        href: '/variety',
      },
      {
        label: 'Probability',
        href: '/probability',
      },
    ],
  },
  {
    label: 'Monitoring',
    href: '/monitoring',
    matIcon: 'poll',
  },
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

export const GLOBAL_NAV_LINKS: INavLink[] = [
  {
    label: 'Deployments',
    href: '/deployment',
    matIcon: 'apps',
    roleRequired: 'deployments.admin',
  },
];
