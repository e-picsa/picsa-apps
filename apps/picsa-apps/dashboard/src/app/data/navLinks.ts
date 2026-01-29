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
      {
        label: 'Admin',
        href: '/admin',
        // TODO - auth role
        // TODO - import from module?
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
      {
        label: 'Admin',
        href: '/admin',
        // TODO - auth role
        // TODO - import from module?
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
  {
    label: 'User Permissions',
    href: '/admin/user-permissions',
    matIcon: 'manage_accounts',
    roleRequired: 'deployments.admin',
  },
];

export const PUBLIC_PAGES = ['privacy-policy', 'terms-of-service'];
