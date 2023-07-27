import { DomPortal } from '@angular/cdk/portal';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { APP_VERSION } from '@picsa/environments';
import { CommunicationService } from '@picsa/shared/services/promptToHomePageService.service';
import * as introJs from 'intro.js/intro.js';
import { Subscription } from 'rxjs';

interface IPageLink {
  name: string;
  icon: string;
  url: string;
  element: string;
}

const PAGE_LINKS: IPageLink[] = [
  {
    name: translateMarker('Manual'),
    icon: 'picsa_manual_tool',
    url: '/manual',
    element: 'element-1',
  },
  {
    name: translateMarker('Resources'),
    icon: 'picsa_resources_tool',
    url: '/resources',
    element: 'element-2',
  },
  {
    name: translateMarker('Monitoring'),
    icon: 'picsa_data_collection',
    url: '/monitoring',
    element: 'element-3',
  },
  {
    name: translateMarker('Climate'),
    icon: 'picsa_climate_tool',
    url: '/climate',
    element: 'element-4',
  },
  {
    name: translateMarker('Budget'),
    icon: 'picsa_budget_tool',
    url: '/budget',
    element: 'element-5',
  },
  {
    name: translateMarker('Probability'),
    icon: 'picsa_probability_tool',
    url: '/crop-probability',
    element: 'element-6',
  },
  {
    name: translateMarker('Options'),
    icon: 'picsa_option_tool',
    url: '/option',
    element: 'element-7',
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
    private communicationService: CommunicationService
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
  startTour(): void {
    const introJS = introJs();
    introJS
      .setOptions({
        hidePrev: true,
        dontShowAgain: true,
        tooltipClass: 'customTooltip',
        steps: [
          {
            title: 'Welcome',
            intro: 'Click Next if you would like to take a tour of the app or click the <b> ’x’ </b>to close.',
          },
          {
            element: '#element-1',
            intro: 'This is the EPICSA Manual. A step-by-step guide to using PICSA with farmers.',
          },
          {
            element: '#element-7',
            intro:
              'This is the options tool that supports farmers to consider a range of options aimed at increasing production, income and resilience.',
          },
          {
            position: 'left',
            element: '#element-6',
            intro:
              'This is the crop-probability tool. It provides immediate calculations on which crops and varieties have the best chance to succeed, according to regions.',
          },
          {
            element: '#element-2',
            intro: 'This is where you’ll find helpful resources that will guide your work.',
          },
          {
            element: '#element-3',
            intro:
              'In here, field staff can make records of visits with farmers and provide data on everything they monitored.',
          },
          {
            element: '#element-4',
            intro:
              'This is the climate tool which provides automatically updated, locally specific climate information graphs. A way for you to analyse the changing climate in your region.',
          },
          {
            element: '#element-5',
            intro:
              'This budget tool is fully interactive and provides a way for farmers to make extensive budgets with respect to different options in their agro-businesses.',
          },
        ],
      })
      .start();
  }

  takeTour(): void {
    const introJS = introJs();
    introJS
      .setOptions({
        hidePrev: true,
        dontShowAgain: true,
        tooltipClass: 'customTooltip',
        steps: [
          {
            element: '#element-1',
            intro: 'This is the EPICSA Manual. A step-by-step guide to using PICSA with farmers.',
          },
          {
            element: '#element-7',
            intro:
              'This is the options tool that supports farmers to consider a range of options aimed at increasing production, income and resilience.',
          },
          {
            position: 'left',
            element: '#element-6',
            intro:
              'This is the crop-probability tool. It provides immediate calculations on which crops and varieties have the best chance to succeed, according to regions.',
          },
          {
            element: '#element-2',
            intro: 'This is where you’ll find helpful resources that will guide your work.',
          },
          {
            element: '#element-3',
            intro:
              'In here, field staff can make records of visits with farmers and provide data on everything they monitored.',
          },
          {
            element: '#element-4',
            intro:
              'This is the climate tool which provides automatically updated, locally specific climate information graphs. A way for you to analyse the changing climate in your region.',
          },
          {
            element: '#element-5',
            intro:
              'This budget tool is fully interactive and provides a way for farmers to make extensive budgets with respect to different options in their agro-businesses.',
          },
        ],
      })
      .start();
  }
}
