import { Component } from '@angular/core';
import { EditorComponent } from '../../components/editor/editor.component';
import { MatDialog} from '@angular/material/dialog';



export interface IOptionData {
  practice: string;
  gender: string [];
  benefits: {benefit:string, beneficiary:string[]} [];
  performance:{lowRf:string, midRf:string,  highRf:string};
  investment: {money:string, time:string};
  time: string;
  risk: string;
}
// let ELEMENT_DATA: IOptionData[] = [
//   { 
//   practice:'ridges', 
//   gender:['female'],
//   benefits: [{
//     benefit:" alot of cash", beneficiary:['male']
//   }, {
//     benefit:" alot of cash", beneficiary:['male', 'female']
//   }
// ],
//   performance:{lowRf:"ok", midRf:"ok",  highRf:"ok"},
//   investment:{money:"high", time:"low"},
//   time:'2', 
//   risk:'expensive' },
// ];

@Component({
  selector: 'option-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  public dataSource: IOptionData[]  = [];
  public displayedColumns: string[] = ['practice', 'gender', 'benefits', 
  'performance','investment','time','risk' ];

  constructor(public dialog: MatDialog) {

  }

  public openDialog() {

    const dialogRef = this.dialog.open(EditorComponent, {
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result.event==='Add') {
        //add to options list
        this.dataSource = [...this.dataSource, result.data];
      }
    });
  }

}