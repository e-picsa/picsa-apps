import { Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd } from '@angular/router';
import type { ActivatedRoute, ActivatedRouteSnapshot, Route, Router } from '@angular/router';
import { debounceTime, filter, map, startWith } from 'rxjs';

function throwIfAlreadyLoaded(parentModule: any, moduleName: string) {
  if (parentModule) {
    throw new Error(`${moduleName} has already been loaded. Import ${moduleName} in the AppModule only.`);
  }
}

/**
 * When embedding as part of another application the route will have an initial prefix
 * Rewrite all existing routes to use the same prefix
 */
export function registerEmbeddedRoutes(routes: Route[], router: Router, prefix: string) {
  const mappedRoutes: Route[] = [];
  for (const route of routes) {
    // Add assigned prefix to all routes and redirects
    route.path = route.path ? `${prefix}/${route.path}` : prefix;
    if (route.redirectTo !== undefined) {
      route.redirectTo = route.redirectTo ? `${prefix}/${route.redirectTo}` : prefix;
    }
    mappedRoutes.push(route);
  }
  // Include all existing router routes except those that have been mapped
  const filteredRoutes = router.config.filter((route) => !route.path?.startsWith(prefix));
  router.resetConfig([...filteredRoutes, ...mappedRoutes]);
}

/**
 * When accessing ActivatedRoute from a provider router hierarchy includes all routers, not just
 * current view router (as identified when using from within a component)
 *
 * Workaround to check all nested routers for params and combined. Adapted from:
 * https://medium.com/simars/ngrx-router-store-reduce-select-route-params-6baff607dd9
 */

function mergeRouterSnapshots(router: Router) {
  const merged: Partial<ActivatedRouteSnapshot> = { data: {}, params: {}, queryParams: {} };
  let route: ActivatedRoute | undefined = router.routerState.root;
  while (route !== undefined) {
    const { data, params, queryParams } = route.snapshot;
    merged.data = { ...merged.data, ...data };
    merged.params = { ...merged.params, ...params };
    merged.queryParams = { ...merged.queryParams, ...queryParams };
    route = route.children.find((child) => child.outlet === 'primary');
  }
  return merged as ActivatedRouteSnapshot;
}

/**
 * Subscribe to snapshot across all active routers
 * This may be useful in cases where a service wants to subscribe to route parameter changes
 * (default behaviour would only detect changes to top-most route)
 * Adapted from https://github.com/angular/angular/issues/46891#issuecomment-1190590046
 */
export function ngRouterMergedSnapshot$(router: Router) {
  return router.events.pipe(
    filter((e) => e instanceof NavigationEnd),
    map(() => mergeRouterSnapshots(router)),
    startWith(mergeRouterSnapshots(router)),
  );
}

export function debounceSignal<T>(source: Signal<T>, delay: number, initialValue: T): Signal<T> {
  return toSignal(toObservable(source).pipe(debounceTime(delay)), {
    initialValue,
  });
}
