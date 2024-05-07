/* eslint-disable @nx/enforce-module-boundaries */
import { DomPortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaCommonComponentsModule, PicsaCommonComponentsService } from '@picsa/components';
import { APP_VERSION, ENVIRONMENT } from '@picsa/environments';
import { MonitoringToolService } from '@picsa/monitoring/src/app/services/monitoring-tool.service';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';
import { TourService } from '@picsa/shared/services/core/tour';
import { Subscription } from 'rxjs';

import { HOME_TOUR } from './extension-home.tour';

interface IPageLink {
  name: string;
  svgIcon: string;
  url: string;
  /** Element ID used in tours */
  tourId: string;
  /** Specify if only shown in dev mode */
  devOnly?: boolean;
}

const PAGE_LINKS: IPageLink[] = [
  {
    name: translateMarker('Manual'),
    svgIcon: 'extension_app:manual_tool',
    url: '/manual',
    tourId: 'manual',
  },
  {
    name: translateMarker('Farmer Activities'),
    svgIcon: 'extension_app:farmer_activity',
    url: '/farmer-activity',
    tourId: 'farmer',
  },
  {
    name: translateMarker('Resources'),
    svgIcon: 'extension_app:resources_tool',
    url: '/resources',
    tourId: 'resources',
  },
  {
    name: translateMarker('Monitoring'),
    svgIcon: 'extension_app:data_collection',
    url: '/monitoring',
    tourId: 'monitoring',
  },
  {
    name: translateMarker('Climate'),
    svgIcon: 'extension_app:climate_tool',
    url: '/climate',
    tourId: 'climate',
  },
  {
    name: translateMarker('Budget'),
    svgIcon: 'extension_app:budget_tool',
    url: '/budget',
    tourId: 'budget',
  },
  {
    name: translateMarker('Probability'),
    svgIcon: 'extension_app:probability_tool',
    url: '/crop-probability',
    tourId: 'crop-probability',
  },
  {
    name: translateMarker('Options'),
    svgIcon: 'extension_app:option_tool',
    url: '/option',
    tourId: 'option',
  },
  {
    name: translateMarker('Seasonal Calendar'),
    svgIcon: 'extension_app:seasonal_calendar_tool',
    url: '/seasonal-calendar',
    tourId: 'seasonal-calendar',
  },

  // {
  //   name: translateMarker('Discussions'),
  //   svgIcon: 'picsa_discussions',
  //   url: '/discussions',
  // },

  // {
  //   name: 'Settings',
  //   svgIcon: 'picsa_settings',
  //   url: '/settings'
  // }
];

/** Additional links only available when running in non-production */
const DEV_PAGE_LINKS: IPageLink[] = [];
if (!ENVIRONMENT.production) {
  for (const link of DEV_PAGE_LINKS) {
    link.devOnly = true;
    PAGE_LINKS.push(link);
  }
}

@Component({
  selector: 'picsa-extension-home',
  standalone: true,
  imports: [CommonModule, MatIconModule, PicsaTranslateModule, PicsaCommonComponentsModule, RouterModule],
  templateUrl: './extension-home.component.html',
  styleUrl: './extension-home.component.scss',
})
export class PicsaExtensionHomeComponent implements OnDestroy, AfterViewInit {
  /** List of home page display links, filtered when running in production */
  public links = PAGE_LINKS;
  public version = APP_VERSION;

  private userEventSubscription: Subscription;

  @ViewChild('headerContent')
  headerContent: ElementRef<HTMLElement>;

  constructor(
    public monitoringService: MonitoringToolService,
    private router: Router,
    private componentsService: PicsaCommonComponentsService,
    private tourService: TourService
  ) {}

  linkClicked(link: IPageLink) {
    this.router.navigate([link.url]);
  }

  ngOnDestroy(): void {
    this.componentsService.patchHeader({ endContent: undefined });
    // this.userEventSubscription.unsubscribe();
  }

  ngAfterViewInit() {
    this.componentsService.patchHeader({
      endContent: new DomPortal(this.headerContent),
    });
    // this.userEventSubscription = this.communicationService.userEvent$.subscribe(() => {
    //   // Trigger the guided tour when the prompt event occurs
    //   this.startTour();
    // });
  }

  public startTour() {
    this.tourService.startTour(HOME_TOUR);
  }
}
