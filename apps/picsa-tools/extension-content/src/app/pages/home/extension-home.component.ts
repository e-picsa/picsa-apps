/* eslint-disable @nx/enforce-module-boundaries */
import { DomPortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaCommonComponentsModule, PicsaCommonComponentsService } from '@picsa/components';
import { ConfigurationService } from '@picsa/configuration/src';
import { APP_VERSION, ENVIRONMENT } from '@picsa/environments';
import { MonitoringToolService } from '@picsa/monitoring/src/app/services/monitoring-tool.service';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';
import { TourService } from '@picsa/shared/services/core/tour';

import { ExtensionToolkitMaterialModule } from '../../material.module';
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

const ADDITIONAL_LINKS: IPageLink[] = [
  {
    name: translateMarker('Resources'),
    svgIcon: 'extension_app:resources_tool',
    url: '/resources',
    tourId: 'resources',
  },
  {
    name: translateMarker('Forecasts'),
    svgIcon: 'extension_app:forecasts_tool',
    // HACK - forecasts currently child resource collection
    // TODO - move to standalone tool
    url: '/resources/collection/weatherResources',
    tourId: 'forecasts',
  },
  {
    name: translateMarker('Farmer Activities'),
    svgIcon: 'extension_app:farmer_activity',
    url: '/farmer',
    tourId: 'farmer',
  },
  {
    name: translateMarker('Monitoring'),
    svgIcon: 'extension_app:data_collection',
    url: '/monitoring',
    tourId: 'monitoring',
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
  selector: 'extension-home',
  imports: [
    CommonModule,
    ExtensionToolkitMaterialModule,
    MatIconModule,
    PicsaCommonComponentsModule,
    PicsaTranslateModule,
    RouterModule,
  ],
  templateUrl: './extension-home.component.html',
  styleUrl: './extension-home.component.scss',
})
export class ExtensionHomeComponent implements AfterViewInit, OnDestroy {
  /** List of home page display links, filtered when running in production */
  public picsaLinks = PAGE_LINKS;
  public additionalLinks = ADDITIONAL_LINKS;
  public version = APP_VERSION;

  @ViewChild('headerContent')
  headerContent: ElementRef<HTMLElement>;

  constructor(
    public monitoringService: MonitoringToolService,
    private router: Router,
    private componentsService: PicsaCommonComponentsService,
    private tourService: TourService,
    private configurationService: ConfigurationService
  ) {}

  linkClicked(link: IPageLink) {
    this.router.navigate([link.url]);
    // hack - ensure farmer version enabled if navigating to it
    if (link.url === '/farmer') {
      this.configurationService.updateUserSettings({ user_type: 'farmer' });
    }
  }

  ngOnDestroy(): void {
    this.componentsService.patchHeader({ cdkPortalEnd: undefined });
  }

  ngAfterViewInit() {
    this.componentsService.patchHeader({
      cdkPortalEnd: new DomPortal(this.headerContent),
    });
  }

  public startTour() {
    this.tourService.startTour(HOME_TOUR);
  }
}
