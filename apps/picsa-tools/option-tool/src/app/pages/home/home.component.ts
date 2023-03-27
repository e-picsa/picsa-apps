import { Component,ViewChild  } from '@angular/core';
import { EditorComponent } from '../../components/editor/editor.component';

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

  @ViewChild(EditorComponent) editorComponent: EditorComponent;

    
  matStepperOpen = false;

  public openDialog() {
    this.matStepperOpen = true
  }
  public closeDialog(){
    this.matStepperOpen = false
  }
  onDataTransfer(data:{data:IOptionData,index:number}) {
    console.log('Received data from editor:', data);
    // close the child component
    if(data.index > -1){
    this.dataSource[data.index]=data.data
    //invoke change detaction
    this.dataSource=[...this.dataSource]
    }else{
    this.dataSource = [...this.dataSource, data.data];
    }
    //detect change for the case of editing a raw
    this.matStepperOpen = false;
  }
  openNewDialog(){
    this.editorComponent.resetVariables();
    this.openDialog()
  }
  onRowClicked(row: IOptionData, index: number) {
    // console.log('Row clicked', row);
    // console.log('Index of the Row', index)
    // open stepper with this data
    // since it is already running with the current home page
    this.editorComponent.presetVariables(row,index);
    this.openDialog()
  }

}
