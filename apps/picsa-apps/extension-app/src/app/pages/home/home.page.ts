import { DomPortal } from '@angular/cdk/portal';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { APP_VERSION } from '@picsa/environments';
import { TourService } from '@picsa/shared/services/core/tour.service';
import { CommunicationService } from '@picsa/shared/services/promptToHomePageService.service';
import { Subscription } from 'rxjs';

import { HOME_TOUR } from './home.tour';

interface IPageLink {
  name: string;
  icon: string;
  url: string;
  /** Element ID used in tours */
  tourId: string;
}

const PAGE_LINKS: IPageLink[] = [
  {
    name: translateMarker('Manual'),
    icon: 'picsa_manual_tool',
    url: '/manual',
    tourId: 'manual',
  },
  {
    name: translateMarker('Resources'),
    icon: 'picsa_resources_tool',
    url: '/resources',
    tourId: 'resources',
  },
  {
    name: translateMarker('Monitoring'),
    icon: 'picsa_data_collection',
    url: '/monitoring',
    tourId: 'monitoring',
  },
  {
    name: translateMarker('Climate'),
    icon: 'picsa_climate_tool',
    url: '/climate',
    tourId: 'climate',
  },
  {
    name: translateMarker('Budget'),
    icon: 'picsa_budget_tool',
    url: '/budget',
    tourId: 'budget',
  },
  {
    name: translateMarker('Probability'),
    icon: 'picsa_probability_tool',
    url: '/crop-probability',
    tourId: 'crop-probability',
  },
  {
    name: translateMarker('Options'),
    icon: 'picsa_option_tool',
    url: '/option',
    tourId: 'option',
  },

  // {
  //   name: translateMarker('Discussions'),
  //   icon: 'picsa_discussions',
  //   url: '/discussions',
  // },

  // {
  //   name: 'Settings',
  //   icon: 'picsa_settings',
  //   url: '/settings'
  // }
];

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnDestroy, AfterViewInit {
  public links = PAGE_LINKS;
  public version = APP_VERSION;

  private userEventSubscription: Subscription;

  @ViewChild('headerContent')
  headerContent: ElementRef<HTMLElement>;

  constructor(
    private router: Router,
    private componentsService: PicsaCommonComponentsService,
    private communicationService: CommunicationService,
    private tourService: TourService
  ) {}

  linkClicked(link: IPageLink) {
    this.router.navigate([link.url]);
  }

  ngOnDestroy(): void {
    this.componentsService.patchHeader({ endContent: undefined });
    this.userEventSubscription.unsubscribe();
  }

  ngAfterViewInit() {
    this.componentsService.patchHeader({
      endContent: new DomPortal(this.headerContent),
    });
    this.userEventSubscription = this.communicationService.userEvent$.subscribe(() => {
      // Trigger the guided tour when the prompt event occurs
      this.startTour();
    });
  }

  public startTour() {
    this.tourService.startTour(HOME_TOUR);
  }
}
