import { Component, ViewChild } from '@angular/core';

// import { Observable } from 'rxjs';
import { EditorComponent } from '../../components/editor/editor.component';
import { RxOptionsDocument } from '../../RxDb';
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
  dbDataDocs: RxOptionsDocument[] = [];

  @ViewChild(EditorComponent) editorComponent: EditorComponent;

  constructor(private dbService: DatabaseService) {
    this.refreashData();
  }

  matStepperOpen = false;

  public openDialog() {
    this.matStepperOpen = true;
  }

  async refreashData() {
    this.dbDataDocs = await this.dbService.db.collections.options.find().exec();
  }

  public closeDialog() {
    this.matStepperOpen = false;
  }
  async onDataTransfer(data: IOptionData | null) {
    if (data) {
      //when the name changes, incrementalUpsert is not enough since the name is the primary key
      if (this.dbDataDocs[this.editorIndex] && this.dbDataDocs[this.editorIndex]._data.practice !== data.practice) {
        //delete old option and add new option
        await this.addORUpdateData(data);
        await this.deleteOption(this.dbDataDocs[this.editorIndex]);
        await this.refreashData();
      } else {
        await this.addORUpdateData(data);
        await this.refreashData();
      }
    } else {
      // remove any existing entry entry if no data passed back
      //delete from db
      if (this.dbDataDocs[this.editorIndex]) {
        await this.deleteOption(this.dbDataDocs[this.editorIndex]);
        await this.refreashData();
      }
    }
    this.closeDialog();
  }
  async addORUpdateData(option: IOptionData) {
    try {
      //handles instertion and update as long as the name is the same.
      await this.dbService.db.collections.options.incrementalUpsert(option);
    } catch (err) {
      alert('Failed to add data, please try again');
      console.error('option.submit(): error:');
      throw err;
    }
  }

  async deleteOption(option: RxOptionsDocument) {
    await option.remove();
  }
  openNewDialog() {
    this.editorIndex = this.dbDataDocs.length;
    this.editorComponent.resetVariables();
    this.openDialog();
  }
  onRowClicked(row: RxOptionsDocument, index: number) {
    this.editorIndex = index;
    this.editorComponent.presetVariables(row._data);
    this.openDialog();
  }
}
