import { EnvironmentInjector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AppRole } from '@picsa/server-types';

import { DeploymentDashboardService } from '../../deployment/deployment.service';
import { DashboardAuthService } from '../services/auth.service';
import { authRoleGuard } from './auth-role.guard';

describe('authRoleGuard', () => {
  let isAuthChecked: ReturnType<typeof signal<boolean>>;
  let authUserId: ReturnType<typeof signal<string | undefined>>;
  let authDeploymentId: ReturnType<typeof signal<string | undefined>>;
  let isDeploymentChecked: ReturnType<typeof signal<boolean>>;
  let deploymentId: ReturnType<typeof signal<string | undefined>>;
  let roles: ReturnType<typeof signal<AppRole[]>>;

  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = {} as RouterStateSnapshot;

  beforeEach(async () => {
    isAuthChecked = signal(true);
    authUserId = signal<string | undefined>('user-1');
    authDeploymentId = signal<string | undefined>('dep-mw');
    isDeploymentChecked = signal(true);
    deploymentId = signal<string | undefined>('dep-mw');
    roles = signal<AppRole[]>([]);

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: DashboardAuthService,
          useValue: {
            isAuthChecked,
            authUserId,
            activeDeploymentId: authDeploymentId,
            hasRole: (role?: AppRole) => (role ? roles().includes(role) : true),
          },
        },
        {
          provide: DeploymentDashboardService,
          useValue: {
            isDeploymentChecked,
            activeDeploymentId: deploymentId,
          },
        },
      ],
    }).compileComponents();
  });

  function runGuard(role: AppRole) {
    const injector = TestBed.inject(EnvironmentInjector);
    return runInInjectionContext(injector, () => authRoleGuard(role)(dummyRoute, dummyState));
  }

  it('allows navigation when ready and user has required role', async () => {
    roles.set(['resources.editor']);

    const result = await runGuard('resources.editor');

    expect(result).toBe(true);
  });

  it('redirects to home when ready and user lacks required role', async () => {
    roles.set(['resources.viewer']);

    const result = await runGuard('resources.admin');

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/');
  });

  it('redirects immediately when auth check completes with no signed-in user', async () => {
    authUserId.set(undefined);
    isDeploymentChecked.set(false);

    const result = await runGuard('resources.editor');

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/');
  });

  it('waits for async auth, deployment check, and activeDeploymentId sync before evaluating roles', async () => {
    isAuthChecked.set(false);
    authUserId.set(undefined);
    isDeploymentChecked.set(false);
    deploymentId.set(undefined);
    authDeploymentId.set(undefined);
    roles.set([]);

    let settled = false;
    const guardPromise = Promise.resolve(runGuard('resources.admin')).then((res) => {
      settled = true;
      return res;
    });

    TestBed.flushEffects();
    await Promise.resolve();
    expect(settled).toBe(false);

    // Session restored
    isAuthChecked.set(true);
    authUserId.set('user-1');
    TestBed.flushEffects();
    await Promise.resolve();
    expect(settled).toBe(false);

    // Deployment loaded, but authService.activeDeploymentId hasn't synced yet
    deploymentId.set('dep-mw');
    isDeploymentChecked.set(true);
    TestBed.flushEffects();
    await Promise.resolve();
    expect(settled).toBe(false);

    // Deployment effect syncs activeDeploymentId & roles resolve
    authDeploymentId.set('dep-mw');
    roles.set(['resources.admin']);
    TestBed.flushEffects();

    const result = await guardPromise;
    expect(result).toBe(true);
  });

  it('does not hang when signed in with no active deployment selected', async () => {
    isAuthChecked.set(true);
    authUserId.set('user-1');
    isDeploymentChecked.set(true);
    deploymentId.set(undefined);
    authDeploymentId.set(undefined);
    roles.set([]);

    const result = await runGuard('resources.editor');

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/');
  });
});
