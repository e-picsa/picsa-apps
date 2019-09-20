import { Component, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs';
import { IResource, IResourceGroup } from '../../models/models';
import { ResourcesStore } from '../../store/resources.store';

@Component({
  selector: 'app-resources',
  templateUrl: './resources.page.html',
  styleUrls: ['./resources.page.scss']
})
export class ResourcesPage implements AfterViewInit {
  resources$: Observable<IResource[]>;
  resourceGroups: IResourceGroup[];
  activeResource: IResource;
  playerWidth: number;
  externalDir: string;
  platformIsWeb = false;

  constructor(public store: ResourcesStore) {}

  ngAfterViewInit() {
    this._setVideoPlayerWidth();
  }

  // video width needs to be set programtically
  _setVideoPlayerWidth() {
    const width = window.innerWidth;
    this.playerWidth = width * 0.9;
    console.log('width', this.playerWidth, window);
  }
}
