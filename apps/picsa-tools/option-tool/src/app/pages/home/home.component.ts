import { Component, Inject } from '@angular/core';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { EditorComponent } from '../../components/editor/editor.component';

const COLUMNS = [
  {
    name: 'practice',
    label: 'Practice',
  },
  {
    name: 'who',
    label: 'Who Does it',
  },
  {
    name: 'benefits',
    label: 'Benefits and Who Benefits',
  },
  {
    name: 'performance',
    label: 'Performance',
  },
];
export interface IOptionData {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}
const ELEMENT_DATA: IOptionData[] = [
  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
];

@Component({
  selector: 'option-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  public dataSource = ELEMENT_DATA;
  public displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];

  constructor(public dialog: MatDialog) {}

  public openDialog() {
    const data: IOptionData = {
      name: 'test',
      position: 1,
      symbol: 'test',
      weight: 2,
    };
    const dialogRef = this.dialog.open(EditorComponent, {
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }
}
