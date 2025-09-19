import { Location, PopStateEvent } from '@angular/common';
import { Injectable, NgZone } from '@angular/core';
import { NavigationEnd, Route, Router } from '@angular/router';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NavigationStackService {
  private stack: string[] = [];
  private redirectRoutes: Set<string>;

  constructor(
    private router: Router,
    private location: Location,
    private zone: NgZone,
  ) {
    this.redirectRoutes = this.collectRedirectRoutes();

    // Track browser back/forward
    fromEvent<PopStateEvent>(window, 'popstate').subscribe(() => {
      this.stack.pop();
    });

    // Track navigation
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => this.onNavigate(e.urlAfterRedirects));

    // Native back button
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('backButton', () => this.zone.run(() => this.back()));
    }

    // Initialize with current URL
    this.stack.push(this.router.url);
  }

  back(): void {
    if (this.stack.length > 1) {
      this.location.back();
    } else {
      // Fallback: go to parent URL
      const parent = this.getParentUrl(this.stack[0]);
      if (parent) {
        this.stack = [parent];
        this.router.navigateByUrl(parent, { replaceUrl: true });
      }
    }
  }

  private onNavigate(url: string) {
    if (!this.isRedirect(url) && this.stack[this.stack.length - 1] !== url) {
      this.stack.push(url);
    }
  }

  private isRedirect(url: string): boolean {
    const clean = url.split('?')[0].split('#')[0];
    return this.redirectRoutes.has(clean);
  }

  private getParentUrl(url: string): string | null {
    const segments = url.split('?')[0].split('#')[0].split('/').filter(Boolean);
    if (segments.length === 0) return null;
    for (let i = segments.length - 1; i > 0; i--) {
      const parent = '/' + segments.slice(0, i).join('/');
      if (!this.isRedirect(parent)) return parent;
    }
    return this.isRedirect('/') ? null : '/';
  }

  private collectRedirectRoutes(): Set<string> {
    const set = new Set<string>();
    const extract = (routes: Route[], parent = '') => {
      for (const r of routes) {
        const path = parent + (r.path ? '/' + r.path : '');
        if (r.redirectTo) set.add(path || '/');
        if (r.children) extract(r.children, path);
      }
    };
    extract(this.router.config);
    return set;
  }
}
