/* eslint-disable @nx/enforce-module-boundaries */
import { DomPortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { PicsaCommonComponentsModule, PicsaCommonComponentsService } from '@picsa/components';
import { ConfigurationService } from '@picsa/configuration/src';
import { IToolsDataEntry, TOOLS_DATA_HASHMAP } from '@picsa/data/tools';
import { APP_VERSION, ENVIRONMENT } from '@picsa/environments';
import { MonitoringToolService } from '@picsa/monitoring/src/app/services/monitoring-tool.service';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';
import { TourService } from '@picsa/shared/services/core/tour';

import { ExtensionToolkitMaterialModule } from '../../material.module';
import { HOME_TOUR } from './extension-home.tour';

interface IPageLink extends IToolsDataEntry {
  /** Element ID used in tours */
  tourId: string;
  /** Specify if only shown in dev mode */
  devOnly?: boolean;
}

const PAGE_LINKS: IPageLink[] = [
  {
    ...TOOLS_DATA_HASHMAP.manual,
    tourId: 'manual',
  },

  {
    ...TOOLS_DATA_HASHMAP.climate,
    tourId: 'climate',
  },
  {
    ...TOOLS_DATA_HASHMAP.budget,
    tourId: 'budget',
  },
  {
    ...TOOLS_DATA_HASHMAP.crop_probability,
    tourId: 'crop-probability',
  },
  {
    ...TOOLS_DATA_HASHMAP.option,
    tourId: 'option',
  },
  {
    ...TOOLS_DATA_HASHMAP.seasonal_calendar,
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
    ...TOOLS_DATA_HASHMAP.resources,
    tourId: 'resources',
  },
  {
    ...TOOLS_DATA_HASHMAP.forecasts,
    tourId: 'forecasts',
  },
  {
    ...TOOLS_DATA_HASHMAP.farmer,
    tourId: 'farmer',
  },
  {
    ...TOOLS_DATA_HASHMAP.monitoring,
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
  public version = APP_VERSION.semver;

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
