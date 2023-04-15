import { Component, ViewChild } from '@angular/core';
import { EditorComponent } from '../../components/editor/editor.component';

export interface IOptionData {
  practice: string;
  gender: string[];
  benefits: { benefit: string; beneficiary: string[] }[];
  performance: { lowRf: string; midRf: string; highRf: string };
  investment: { money: string; time: string };
  time: string;
  risk: string;
}

@Component({
  selector: 'option-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  public dataSource: IOptionData[] = [];
  public displayedColumns: string[] = ['practice', 'gender', 'benefits', 'performance', 'investment', 'time', 'risk'];

  private editorIndex = 0;

  @ViewChild(EditorComponent) editorComponent: EditorComponent;

  matStepperOpen = false;

  public openDialog() {
    this.matStepperOpen = true;
  }
  public closeDialog() {
    this.matStepperOpen = false;
  }
  onDataTransfer(data: IOptionData | null) {
    // create a deep clone of data source to allow change detection for nested array objects
    const allData = JSON.parse(JSON.stringify(this.dataSource));
    if (data) {
      allData[this.editorIndex] = data;
    } else {
      // remove any existing entry entry if no data passed back
      if (allData[this.editorIndex]) {
        allData.splice(this.editorIndex, 1);
      }
    }
    this.dataSource = allData;
    this.closeDialog();
  }
  openNewDialog() {
    this.editorIndex = this.dataSource.length;
    this.editorComponent.resetVariables();
    this.openDialog();
  }
  onRowClicked(row: IOptionData, index: number) {
    this.editorIndex = index;
    this.editorComponent.presetVariables(row);
    this.openDialog();
  }
}
