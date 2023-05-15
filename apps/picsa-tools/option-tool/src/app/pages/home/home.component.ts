import {Component, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';

import { EditorComponent } from '../../components/editor/editor.component';
import { RxOptionsDocument } from '../../RxDB.d';
import { DatabaseService } from '../../services';


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
  providers: [DatabaseService],
})
export class HomeComponent {
  public optionsDisplayList: IOptionData[] = [];
  public displayedColumns: string[] = ['practice', 'gender', 'benefits', 'performance', 'investment', 'time', 'risk'];

  private editorIndex = 0;
  // private options$: Observable<RxOptionsDocument[]>;

  @ViewChild(EditorComponent) editorComponent: EditorComponent;

  constructor(private dbService: DatabaseService) {
    this.fetchDbData() 
  }

  matStepperOpen = false;

  public openDialog() {
    this.matStepperOpen = true;
  }

  async fetchDbData() {
    const items = await  this.dbService.db.collections.options.find().exec();
    let dbItemList:IOptionData[] = [];
    for(let i =0; i<items.length; i=i+1){
      dbItemList.push(items[i]._data)
    }
    this.optionsDisplayList = dbItemList
  }

  public closeDialog() {
    this.matStepperOpen = false;
  }
  async onDataTransfer(data: any) {
    // create a deep clone of data source to allow change detection for nested array objects
    const allData = JSON.parse(JSON.stringify(this.optionsDisplayList));
    if (data) {
      allData[this.editorIndex] = data;
      try {
        //handles instertion and update as long as the name is the same. 
        await this.dbService.db.collections.options.incrementalUpsert(data)
      } catch (err) {
        console.error('option.submit(): error:');
        throw err;
      }
    } else {
      // remove any existing entry entry if no data passed back
      //delete from db
      if (allData[this.editorIndex]) {
        allData.splice(this.editorIndex, 1);
      }
    }
    this.optionsDisplayList = allData;
    this.closeDialog();
  }
  deleteOption(option:RxOptionsDocument ) {
    option.remove();
  }
  openNewDialog() {
    this.editorIndex = this.optionsDisplayList.length;
    this.editorComponent.resetVariables();
    this.openDialog();
  }
  onRowClicked(row: IOptionData, index: number) {
    this.editorIndex = index;
    this.editorComponent.presetVariables(row);
    this.openDialog();
  }
}
