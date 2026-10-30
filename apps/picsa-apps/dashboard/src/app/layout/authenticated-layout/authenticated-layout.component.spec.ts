import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { SupabaseAuthService } from '@picsa/shared/services/core/supabase/services/supabase-auth.service';

import { DeploymentDashboardService } from '../../modules/deployment/deployment.service';
import { AuthenticatedLayoutComponent, SIDEBAR_COLLAPSED_KEY } from './authenticated-layout';

describe('AuthenticatedLayoutComponent', () => {
  let component: AuthenticatedLayoutComponent;
  let fixture: ComponentFixture<AuthenticatedLayoutComponent>;

  const mockSupabaseAuthService = {
    signInDashboardDevUser: jest.fn().mockResolvedValue(null),
    authUser: signal(null),
    isAuthChecked: signal(true),
  };

  const mockDeploymentService = {
    activeDeployment: signal(null),
    userDeployments: signal([]),
    allDeployments: signal([]),
    pendingRequests: signal([]),
    isDeploymentChecked: signal(true),
  };

  beforeEach(async () => {
    localStorage.removeItem(SIDEBAR_COLLAPSED_KEY);

    await TestBed.configureTestingModule({
      imports: [AuthenticatedLayoutComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: SupabaseAuthService, useValue: mockSupabaseAuthService },
        { provide: DeploymentDashboardService, useValue: mockDeploymentService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthenticatedLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem(SIDEBAR_COLLAPSED_KEY);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to expanded state when localStorage is clear', () => {
    expect(component.isCollapsed()).toBe(false);
  });

  it('should toggle collapse state and persist to localStorage', () => {
    expect(component.isCollapsed()).toBe(false);

    component.toggleSidebar();
    expect(component.isCollapsed()).toBe(true);
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe('true');

    component.toggleSidebar();
    expect(component.isCollapsed()).toBe(false);
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe('false');
  });

  it('should apply .is-collapsed class to mat-sidenav when collapsed', () => {
    component.toggleSidebar();
    fixture.detectChanges();

    const sidenavEl = fixture.nativeElement.querySelector('mat-sidenav');
    expect(sidenavEl.classList.contains('is-collapsed')).toBe(true);
  });

  it('should expand on hover when collapsed and reset on mouse leave', () => {
    component.toggleSidebar(); // collapse
    expect(component.isCollapsed()).toBe(true);
    expect(component.isEffectiveExpanded()).toBe(false);

    component.onMouseEnter();
    expect(component.isHovered()).toBe(true);
    expect(component.isEffectiveExpanded()).toBe(true);

    fixture.detectChanges();
    const sidenavEl = fixture.nativeElement.querySelector('mat-sidenav');
    expect(sidenavEl.classList.contains('is-hovered')).toBe(true);

    component.onMouseLeave();
    expect(component.isHovered()).toBe(false);
    expect(component.isEffectiveExpanded()).toBe(false);
  });

  it('should dynamically update fixedTopGap on scroll to hide header without gap', () => {
    expect(component.fixedTopGap()).toBe(64);

    // Simulate scrolling by 30px
    Object.defineProperty(window, 'scrollY', { value: 30, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(component.fixedTopGap()).toBe(34);

    // Simulate scrolling past toolbar height (e.g. 100px)
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(component.fixedTopGap()).toBe(0);

    // Reset window scroll
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(component.fixedTopGap()).toBe(64);
  });
});
