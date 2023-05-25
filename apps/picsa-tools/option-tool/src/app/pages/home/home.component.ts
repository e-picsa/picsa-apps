import { Component, OnDestroy, ViewChild } from '@angular/core';
import { RxDocument } from 'rxdb';
import { Subject, takeUntil } from 'rxjs';

// import { Observable } from 'rxjs';
import { EditorComponent } from '../../components/editor/editor.component';
import { IOptionsToolEntry } from '../../schemas/schema_v0';
import { OptionsToolService } from '../../services/options-tool.service';

@Component({
  selector: 'option-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnDestroy {
  public optionsDisplayList: IOptionsToolEntry[] = [];
  public displayedColumns: string[] = ['practice', 'gender', 'benefits', 'performance', 'investment', 'time', 'risk'];

  public dbDataDocs: RxDocument<IOptionsToolEntry>[] = [];
  public matStepperOpen = false;

  private editorIndex = 0;
  private componentDestroyed$ = new Subject();

  @ViewChild(EditorComponent) editorComponent: EditorComponent;

  constructor(private service: OptionsToolService) {
    this.subscribeToDbChanges();
  }

  /** Initialise service and subscribe to data changes */
  private async subscribeToDbChanges() {
    await this.service.initialise();
    // create a live query to retrieve all docs on data change
    // pipe subscription to complete when component destroyed (avoids memory leak)
    const query = this.service.dbCollection.find();
    query.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((docs) => {
      this.dbDataDocs = docs;
    });
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  public openDialog() {
    this.matStepperOpen = true;
  }

  public closeDialog() {
    this.matStepperOpen = false;
  }
  async onDataTransfer(data: IOptionsToolEntry | null) {
    if (data) {
      //when the name changes, incrementalUpsert is not enough since the name is the primary key
      if (this.dbDataDocs[this.editorIndex] && this.dbDataDocs[this.editorIndex]._data.practice !== data.practice) {
        //delete old option and add new option
        await this.service.addORUpdateData(data);
        await this.service.deleteOption(this.dbDataDocs[this.editorIndex]);
      } else {
        await this.service.addORUpdateData(data);
      }
    } else {
      // remove any existing entry entry if no data passed back
      //delete from db
      if (this.dbDataDocs[this.editorIndex]) {
        await this.service.deleteOption(this.dbDataDocs[this.editorIndex]);
      }
    }
    this.closeDialog();
  }

  openNewDialog() {
    this.editorIndex = this.dbDataDocs.length;
    this.editorComponent.resetVariables();
    this.openDialog();
  }
  onRowClicked(row: RxDocument<IOptionsToolEntry>, index: number) {
    this.editorIndex = index;
    this.editorComponent.presetVariables(row._data);
    this.openDialog();
  }
}
