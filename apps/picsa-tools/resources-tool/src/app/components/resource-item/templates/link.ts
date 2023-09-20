import { IResourceLink } from '../../../models';
import { ResourceItemComponent } from '../resource-item.component';

export class LinkItemHandler {
  resource: IResourceLink;
  constructor(private component: ResourceItemComponent) {
    this.resource = component.resource as IResourceLink;
    component.handleResourceClick = (e) => this.handleClick(e);
    this.handleOverrides();
  }
  private async handleOverrides() {
    this.component.actionButton = {
      icon: (this.resource.icon as any) || 'tab',
    };
  }

  private handleClick(e: Event) {
    e.stopPropagation();
    this.component.store.openBrowserLink(this.resource.url);
  }
}
