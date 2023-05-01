import { Component, TemplateRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

interface IUserProfile {
  name: string;
  initials: string;
  color: string;
  icon: string;
  type: 'extension' | 'farmer';
}

@Component({
  selector: 'picsa-profile-select',
  templateUrl: './profile-select.component.html',
  styleUrls: ['./profile-select.component.scss'],
})
export class ProfileSelectComponent {
  constructor(public dialog: MatDialog) {}
}
