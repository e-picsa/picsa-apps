export interface INavLink {
  label: string;
  href: string;
  matIcon?: string;
  children?: INavLink[];
}

export const DASHBOARD_NAV_LINKS = [
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
