import { Component, AfterViewInit, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { IResource, IResourceGroup } from '../../models';
import { ResourcesStore } from '../../stores';

@Component({
  selector: 'picsa-resource-list',
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
})
export class ResourceListComponent implements AfterViewInit {
  @Input() resources: IResource[];
  // resources$: Observable<IResource[]>;
  // resourceGroups: IResourceGroup[];
  // activeResource: IResource | undefined;
  // playerWidth: number;
  // externalDir: string;
  // platformIsWeb = false;

  constructor(public store: ResourcesStore) {}

  ngAfterViewInit() {
    this._setVideoPlayerWidth();
  }

  unsetResources() {
    // this.activeResource = undefined;
  }

  // video width needs to be set programtically
  _setVideoPlayerWidth() {
    // const width = window.innerWidth;
    // this.playerWidth = width * 0.9;
    // console.log('width', this.playerWidth, window);
  }
}
