import { Component, Input } from '@angular/core';

@Component({
  selector: 'whatsapp-group',
  templateUrl: 'whatsapp-group.html',
  styleUrls: ['./whatsapp-group.scss']
})
export class WhatsappGroupComponent {
  @Input('group') group: IWhatsAppGroup;

  constructor() {}
}

export interface IWhatsAppGroup {
  label: string;
  description: string;
  link: string;
  private?: boolean;
}
