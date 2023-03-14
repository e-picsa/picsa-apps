import { Component  } from '@angular/core';

export interface IOptionData {
  practice: string;
  gender: string [];
  benefits: {benefit:string, beneficiary:string[]} [];
  performance:{lowRf:string, midRf:string,  highRf:string};
  investment: {money:string, time:string};
  time: string;
  risk: string;
}

@Component({
  selector: 'option-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  
})
export class HomeComponent {
  public dataSource: IOptionData[]  = [];
  public displayedColumns: string[] = ['practice', 'gender', 'benefits', 
  'performance','investment','time','risk' ];
    
  matStepperOpen = false;

  public openDialog() {
    this.matStepperOpen = true
  }
  public closeDialog(){
    this.matStepperOpen = false
  }
  onDataTransfer(data: IOptionData) {
    console.log('Received data from editor:', data);
    // close the child component
    this.dataSource = [...this.dataSource, data];
    this.matStepperOpen = false;
  }

}
