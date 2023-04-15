import { Component } from '@angular/core';
import { IWhatsAppGroup } from '../../components/whatsapp-group/whatsapp-group';

@Component({
  selector: 'app-discussions',
  templateUrl: './discussions.page.html',
  styleUrls: ['./discussions.page.scss'],
})
export class DiscussionsPage {
  groups: IWhatsAppGroup[] = [
    {
      label: 'App Feedback',
      description: 'Give your suggestions or ask for help using the PICSA app',
      link: 'https://chat.whatsapp.com/8wEc1tjLRqI7XyU4Lv5OLk',
    },
  ];
}
