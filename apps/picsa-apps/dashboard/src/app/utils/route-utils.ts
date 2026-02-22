import { Route } from '@angular/router';
import { AppRole } from '@picsa/server-types';
import { capitalise } from '@picsa/utils';

import { authRoleGuard } from '../modules/auth/guards/auth-role.guard';

export interface INavLink {
  label: string;
  href: string;
  roleRequired?: AppRole;
  matIcon?: string;
  children?: INavLink[];
}

export interface NavConfig {
  label?: string;
  icon?: string;
  hidden?: boolean;
}

export interface RecursiveFeatureNode extends Route {
  path: string;
  nav?: NavConfig;
  roleRequired?: AppRole;
  children?: RecursiveFeatureNode[];
}

export interface FeatureDefinition {
  ROUTES: Route[];
  NAV_LINKS: INavLink[];
  ROOT_PATH: string;
}

function buildRecursiveRoutes(node: RecursiveFeatureNode, parentRole?: AppRole): Route {
  const { nav, roleRequired, children, ...routeConfig } = node;
  const applicableRole = roleRequired || parentRole;

  const route: Route = {
    ...routeConfig,
    children: children ? children.map((child) => buildRecursiveRoutes(child, applicableRole)) : undefined,
  };

  if (applicableRole) {
    const existingGuards = route.canActivate || [];
    route.canActivate = [...existingGuards, authRoleGuard(applicableRole)];
  }

  return route;
}

function buildRecursiveNavLinks(
  node: RecursiveFeatureNode,
  parentPath: string,
  parentRole?: AppRole,
): INavLink | undefined {
  // Skip parameters or wildcards in navigation unless explicitly labeled
  if (node.path.includes(':') || node.path === '**') {
    return undefined;
  }

  const applicableRole = node.roleRequired || parentRole;

  const prefix = parentPath === '/' ? '' : parentPath;
  const currentPath = node.path ? `${prefix}/${node.path}` : parentPath;

  const childrenLinks: INavLink[] = [];
  if (node.children) {
    for (const child of node.children) {
      const childResult = buildRecursiveNavLinks(child, currentPath, applicableRole);

      if (childResult) {
        childrenLinks.push(childResult);
      }
    }
  }

  // If hidden, return only collected hoisted links
  if (node.nav?.hidden) {
    return undefined;
  }

  // If this node has no label, no children links, and no path, we don't create a nav link for it
  if (!node.nav?.label && !childrenLinks.length && !node.path) {
    return undefined;
  }

  const link: INavLink = {
    label: node.nav?.label || capitalise(node.path || ''),
    href: currentPath,
    matIcon: node.nav?.icon,
    roleRequired: applicableRole,
    children: childrenLinks.length > 0 ? childrenLinks : undefined,
  };

  return link;
}

/**
 * Utility to help define app routes alongside navbar configuration and auth restrictions
 */
export function defineFeature(config: RecursiveFeatureNode): FeatureDefinition {
  const routes = [
    buildRecursiveRoutes({
      ...config,
      path: '',
    }),
  ];

  // Nav Links: Use the original path structure
  const navLink = buildRecursiveNavLinks(config, '', undefined);

  return {
    ROUTES: routes,
    NAV_LINKS: navLink ? [navLink] : [],
    ROOT_PATH: config.path,
  };
}
