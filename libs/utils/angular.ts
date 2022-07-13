import type { Route, Router } from '@angular/router';

export function throwIfAlreadyLoaded(parentModule: any, moduleName: string) {
  if (parentModule) {
    throw new Error(
      `${moduleName} has already been loaded. Import ${moduleName} in the AppModule only.`
    );
  }
}

/**
 * When embedding as part of another application the route will have an initial prefix
 * Rewrite all existing routes to use the same prefix
 */
export function registerEmbeddedRoutes(
  routes: Route[],
  router: Router,
  prefix: string
) {
  router.resetConfig([
    ...router.config.filter((route) => !route.path?.startsWith(prefix)),
    ...routes.map((route) => {
      route.path = route.path ? `${prefix}/${route.path}` : prefix;
      if (route.redirectTo !== undefined) {
        route.redirectTo = route.redirectTo
          ? `${prefix}/${route.redirectTo}`
          : prefix;
      }
      return route;
    }),
  ]);
}
