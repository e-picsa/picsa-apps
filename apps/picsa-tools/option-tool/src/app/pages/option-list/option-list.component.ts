import { Component } from '@angular/core';

@Component({
  selector: 'option-list',
  templateUrl: './option-list.component.html',
  styleUrls: ['./option-list.component.scss'],
})
export class OptionListComponent {
  options = ['crop', 'livestock', 'fruits', 'fish', 'afforestation'];
}
