import { IResourceApp } from '../../../models';
import { ResourceItemComponent } from '../resource-item.component';

export class AppItemHandler {
  resource: IResourceApp;
  constructor(private component: ResourceItemComponent) {
    this.resource = component.resource as IResourceApp;
    component.handleResourceClick = (e) => this.handleClick(e);
    this.handleOverrides();
  }
  private async handleOverrides() {
    this.component.actionButton = { icon: 'picsa_play_store', svgIcon: true };
  }

  private handleClick(e: Event) {
    e.stopPropagation();
    const { appId } = this.resource;
    this.component.store.openBrowserLink(`https://play.google.com/store/apps/details?id=${appId}`);
  }
}
