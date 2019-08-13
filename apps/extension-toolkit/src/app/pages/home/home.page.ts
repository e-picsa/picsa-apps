import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ENVIRONMENT } from '@picsa/environments';
import { APP_VERSION } from '@picsa/environments/version';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  links: ILink[];
  name: string;
  version = APP_VERSION;
  subtitle: string = ENVIRONMENT.region.subtitle;

  constructor(private router: Router) {
    this.links = [
      {
        name: 'Resources',
        icon: 'book',
        url: '/resources'
      },
      {
        name: 'Tools',
        icon: 'tablet-portrait',
        url: '/tools'
      },
      {
        name: 'Discussions',
        icon: 'chatbubbles',
        url: '/discussions'
      },
      {
        name: 'Data Collection',
        img: 'data-collection',
        url: '/data/record'
      },
      {
        name: 'Settings',
        icon: 'settings',
        url: '/settings'
      }
    ];
  }
  linkClicked(link: ILink) {
    this.router.navigate([link.url]);
  }
}

interface ILink {
  name: string;
  icon?: string;
  img?: string;
  url: string;
}
