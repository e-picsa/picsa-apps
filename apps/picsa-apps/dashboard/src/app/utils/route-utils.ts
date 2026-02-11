import { Route } from '@angular/router';
import { AppRole } from '@picsa/server-types';
import { capitalise } from '@picsa/utils';

import { authRoleGuard } from '../modules/auth/guards/auth-role.guard';

export interface DashboardRoute extends Route {
  path: string;
  roleRequired?: AppRole;
  navLabel?: string; // Optional override for the navigation label
  matIcon?: string; // Icon for the navigation link
}

export interface INavLink {
  label: string;
  href: string; // relative path (or absolute if from root)
  roleRequired?: AppRole;
  matIcon?: string;
  children?: INavLink[];
}

const toAuthRoute = ({ roleRequired, navLabel, matIcon, ...route }: DashboardRoute): Route => {
  void navLabel;
  void matIcon;
  if (roleRequired) {
    // preserve existing canActivate if present
    const existingGuards = route.canActivate || [];
    route.canActivate = [...existingGuards, authRoleGuard(roleRequired as AppRole)];
  }
  return route;
};

const toAuthRoutes = (routes: DashboardRoute[]) => routes.map(toAuthRoute);

const toNavLink = ({ path, roleRequired, navLabel, matIcon }: DashboardRoute): INavLink | undefined => {
  // Ignore routes with deep paths (containing /), parameters (:), or wildcards (**).
  // Also ignore empty paths unless they are meant to be the root link (but typically root link is the parent module).
  // If we want the empty path to represent the "Home" of this feature...
  if (path.includes('/') || path.includes(':') || path === '**') return undefined;

  // If path is empty, we skips it as it's typically the feature root handled by the parent
  if (path === '') return undefined;

  return {
    label: navLabel || capitalise(path),
    href: `/${path}`,
    roleRequired,
    matIcon,
  };
};

const toNavLinks = (routes: DashboardRoute[]) => routes.map(toNavLink).filter((v): v is INavLink => v !== undefined);

export interface FeatureConfig {
  rootPath: string;
  navLabel: string;
  matIcon?: string;
  roleRequired?: AppRole;
  routes: DashboardRoute[];
}

export interface FeatureDefinition {
  ROUTES: Route[];
  NAV_LINK: INavLink;
  ROOT_PATH: string;
}

export function defineFeature(config: FeatureConfig): FeatureDefinition {
  const routes = toAuthRoutes(config.routes);
  const childLinks = toNavLinks(config.routes);

  const navLink: INavLink = {
    label: config.navLabel,
    href: `/${config.rootPath}`,
    matIcon: config.matIcon,
    roleRequired: config.roleRequired,
    children: childLinks.length > 0 ? childLinks : undefined,
  };

  return {
    ROUTES: routes,
    NAV_LINK: navLink,
    ROOT_PATH: config.rootPath,
  };
}
