import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { APP_VERSION } from '@picsa/environments';
import { UserStore } from '../../store/user.store';
import { PicsaFileService } from '@picsa/shared/services/native';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  links: ILink[];
  name: string;
  version = APP_VERSION;
  subtitle = 'Extension';
  columns: number;
  isPreparingShare = false;

  constructor(
    private router: Router,
    public store: UserStore,
    // TODO - refactor to separate store
    private platform: Platform,
    private fileService: PicsaFileService
  ) {
    this.links = [
      {
        ...LINK_DEFAULTS,
        name: 'Climate Tool',
        icon: 'picsa_climate-tool',
        url: '/climate',
      },
      {
        ...LINK_DEFAULTS,
        name: 'Budget Tool',
        icon: 'picsa_budget-tool',
        url: '/budget',
      },
      {
        ...LINK_DEFAULTS,
        name: 'Resources',
        icon: 'picsa_resources',
        url: '/resources',
      },
      {
        ...LINK_DEFAULTS,
        name: 'Monitoring',
        icon: 'picsa_data-collection',
        url: '/monitoring',
      },
      {
        ...LINK_DEFAULTS,
        name: 'Discussions',
        icon: 'picsa_discussions',
        url: '/discussions',
      },

      // {
      //   ...LINK_DEFAULTS,
      //   name: 'Settings',
      //   icon: 'picsa_settings',
      //   url: '/settings'
      // }
    ];
  }
  linkClicked(link: ILink) {
    console.log('link clicked', link);
    this.router.navigate([link.url]);
  }

  ngOnInit() {
    this.columns = this._calculateColumns(window.innerWidth);
  }
  async shareApp() {
    if (this.platform.is('cordova')) {
      this.isPreparingShare = true;
      await this.fileService.shareAppApk();
      this.isPreparingShare = false;
    }
  }
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.columns = this._calculateColumns(event.target.innerWidth);
  }
  _calculateColumns(width: number) {
    return width < 425 ? 2 : width < 800 ? 3 : 6;
  }
}

const LINK_DEFAULTS = {
  cols: 1,
  rows: 1,
};

interface ILink {
  name: string;
  cols: number;
  rows: number;
  icon: string;
  img?: string;
  url?: string;
}
