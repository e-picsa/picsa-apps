import { DestroyRef, effect, inject, signal, Signal, untracked } from '@angular/core';
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

/**
 * Creates a new Signal that emits the value of the source Signal only after a
 * specified delay has passed without any new emissions.
 * * Note: Must be called within an injection context (e.g., component constructor
 * or field initializer) unless an Injector is explicitly provided.
 *
 * @param source - The original Signal to track.
 * @param delay - The time to wait in milliseconds before updating the returned Signal.
 * @param initialValue - The initial value for the returned Signal before the first emission.
 * @returns A new, debounced Signal.
 */
export function debounceSignal<T>(source: Signal<T>, delay: number, initialValue: T): Signal<T> {
  const debounced = signal<T>(initialValue);
  const destroyRef = inject(DestroyRef);
  let timeoutId: ReturnType<typeof setTimeout>;

  // 1. Native effect tracks the source and handles the debounce timer
  effect(() => {
    const value = source();
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => debounced.set(value), delay);
  });

  // 2. Cleanup hook flushes the final value when the component dies
  destroyRef.onDestroy(() => {
    clearTimeout(timeoutId);
    debounced.set(untracked(source));
  });

  return debounced.asReadonly();
}

/**
 * Creates an Angular effect that debounces a specific side-effect action.
 * Crucially, if the component (or injection context) is destroyed while a
 * debounced action is currently pending in the timer, it will automatically
 * flush and execute that action immediately before teardown.
 * @param source Signal to track changes
 * @param action Callback to execute after the delay. It runs in an `untracked`
 * context, ensuring signals read inside it do not accidentally re-trigger the effect.
 * @param delay  The debounce delay in milliseconds.
 *
 * @example
 * ```ts
 * export class UserFormComponent {
 * public formModel = signal({ name: '', email: '' });
 * constructor() {
 * // Auto-save the form 500ms after the user stops typing.
 * // If the user navigates away before the 500ms is up, it saves immediately.
 * debouncedEffect(() => this.formModel(), (latestData) => {
 * if (this.isValid(latestData)) {
 * this.apiService.saveDraft(latestData);
 * }}, 500 ); }}
 * ```
 */
export function debouncedEffect<T>(source: Signal<T> | (() => T), action: (value: T) => void, delay: number = 500) {
  const destroyRef = inject(DestroyRef);
  let timeoutId: ReturnType<typeof setTimeout>;
  let isPending = false;
  let latestValue: T;

  // 1. The effect tracks the source function
  effect(() => {
    latestValue = source();
    isPending = true;
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      isPending = false;
      // Use untracked so signals read inside the action don't become dependencies of this effect
      untracked(() => action(latestValue));
    }, delay);
  });

  // 2. On destroy, execute the action immediately if a timer is still ticking
  destroyRef.onDestroy(() => {
    clearTimeout(timeoutId);
    if (isPending) {
      console.log('Component destroying: Flushing pending effect action...');
      action(latestValue);
    }
  });
}
