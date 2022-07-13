import { Component } from '@angular/core';
import { ResourcesStore } from '../../stores';

@Component({
  selector: 'picsa-resources-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  // playerWidth: number;
  // externalDir: string;
  // platformIsWeb = false;

  constructor(public store: ResourcesStore) {}

  ngAfterViewInit() {
    this._setVideoPlayerWidth();
  }

  // video width needs to be set programtically
  _setVideoPlayerWidth() {
    // const width = window.innerWidth;
    // this.playerWidth = width * 0.9;
    // console.log('width', this.playerWidth, window);
  }
}
