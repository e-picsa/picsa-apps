import { DomPortal } from '@angular/cdk/portal';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { APP_VERSION } from '@picsa/environments';

const PAGE_LINKS: ILink[] = [
  {
    name: translateMarker('Manual'),
    icon: 'picsa_manual_tool',
    url: '/manual',
  },
  {
    name: translateMarker('Resources'),
    icon: 'picsa_resources_tool',
    url: '/resources',
  },
  {
    name: translateMarker('Monitoring'),
    icon: 'picsa_data_collection',
    url: '/monitoring',
  },
  {
    name: translateMarker('Climate'),
    icon: 'picsa_climate_tool',
    url: '/climate',
  },
  {
    name: translateMarker('Budget'),
    icon: 'picsa_budget_tool',
    url: '/budget',
  },
  {
    name: translateMarker('Probability'),
    icon: 'picsa_probability_tool',
    url: '/crop-probability',
  },
  {
    name: translateMarker('Options'),
    icon: 'picsa_option_tool',
    url: '/option',
  },

  // {
  //   ...LINK_DEFAULTS,
  //   name: translateMarker('Discussions'),
  //   icon: 'picsa_discussions',
  //   url: '/discussions',
  // },

  // {
  //   ...LINK_DEFAULTS,
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
  public links: ILink[];
  public version = APP_VERSION;

  @ViewChild('headerContent')
  headerContent: ElementRef<HTMLElement>;

  constructor(private router: Router, private componentsService: PicsaCommonComponentsService) {
    this.links = PAGE_LINKS;
  }

  linkClicked(link: ILink) {
    this.router.navigate([link.url]);
  }

  ngOnDestroy(): void {
    this.componentsService.patchHeader({ endContent: undefined });
  }
  ngAfterViewInit() {
    this.componentsService.patchHeader({
      endContent: new DomPortal(this.headerContent),
    });
  }
}

interface ILink {
  name: string;
  icon: string;
  img?: string;
  url?: string;
}
