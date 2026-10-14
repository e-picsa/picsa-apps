import { NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { APP_VERSION } from '@picsa/environments/src/version';

import { ADMIN_NAV_LINKS, DASHBOARD_NAV_LINKS } from '../../data';
import { DashboardMaterialModule } from '../../material.module';
import { AuthRoleRequiredDirective } from '../../modules/auth';
import { DeploymentSelectComponent } from '../../modules/deployment/components';
import { ProfileMenuComponent } from '../../modules/profile/components/profile-menu/profile-menu.component';
import { DashboardFooterComponent } from '../footer/footer.component';

export const SIDEBAR_COLLAPSED_KEY = 'picsa_dashboard_sidebar_collapsed';

const getInitialCollapsedState = (): boolean => {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
};

@Component({
  imports: [
    NgTemplateOutlet,
    RouterModule,
    DashboardFooterComponent,
    MatProgressSpinnerModule,
    DashboardMaterialModule,
    DeploymentSelectComponent,
    ProfileMenuComponent,
    AuthRoleRequiredDirective,
  ],
  selector: 'dashboard-authenticated-layout',
  templateUrl: './authenticated-layout.html',
  styleUrls: ['./authenticated-layout.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthenticatedLayoutComponent implements AfterViewInit {
  private elementRef = inject(ElementRef);
  private destroyRef = inject(DestroyRef);

  @ViewChild('toolbar', { read: ElementRef }) toolbarRef?: ElementRef<HTMLElement>;

  navLinks = DASHBOARD_NAV_LINKS;
  adminLinks = ADMIN_NAV_LINKS;
  appVersion = APP_VERSION;

  isCollapsed = signal<boolean>(getInitialCollapsedState());
  isHovered = signal<boolean>(false);
  fixedTopGap = signal<number>(64);

  isEffectiveExpanded = computed(() => !this.isCollapsed() || this.isHovered());

  ngAfterViewInit() {
    const scrollContainer = this.elementRef.nativeElement.closest('.page') as HTMLElement | null;

    const updateGap = () => {
      const toolbarHeight = this.toolbarRef?.nativeElement?.offsetHeight || 64;
      const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
      const gap = Math.max(0, toolbarHeight - scrollTop);
      if (this.fixedTopGap() !== gap) {
        this.fixedTopGap.set(gap);
      }
    };

    updateGap();

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', updateGap, { passive: true });
      this.destroyRef.onDestroy(() => {
        scrollContainer.removeEventListener('scroll', updateGap);
      });
    }

    window.addEventListener('scroll', updateGap, { passive: true });
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', updateGap);
    });
  }

  toggleSidebar() {
    this.isCollapsed.update((collapsed) => {
      const next = !collapsed;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
    this.isHovered.set(false);
  }

  onMouseEnter() {
    if (this.isCollapsed()) {
      this.isHovered.set(true);
    }
  }

  onMouseLeave() {
    if (this.isCollapsed()) {
      this.isHovered.set(false);
    }
  }
}
