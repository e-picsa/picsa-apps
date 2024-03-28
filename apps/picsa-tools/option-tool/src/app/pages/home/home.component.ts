import { Component, OnDestroy, ViewChild } from '@angular/core';
import { RxDocument } from 'rxdb';
import { Subject, takeUntil } from 'rxjs';

// import { Observable } from 'rxjs';
import { EditorComponent } from '../../components/editor/editor.component';
import { ENTRY_TEMPLATE, IOptionsToolEntry } from '../../schemas';
import { OptionsToolService } from '../../services/options-tool.service';
import { _wait } from '@picsa/utils';
import { OptionStore } from '../../components/store/option.store';
@Component({
  selector: 'option-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnDestroy {
  public optionsDisplayList: IOptionsToolEntry[] = [];

  /** List of columns to display in table. Note, order will match template keys */
  public displayedColumns = Object.keys(ENTRY_TEMPLATE()).filter((key) => !key.startsWith('_'));

  /** List of columns to display subheader row for */
  public subheaderColumns: string[];

  public dbDataDocs: RxDocument<IOptionsToolEntry>[] = [];
  public matStepperOpen = false;

  private editorIndex = 0;
  private componentDestroyed$ = new Subject();

  public status = 'share';
  public shareDisabled = false;

  @ViewChild(EditorComponent) editorComponent: EditorComponent;

  constructor(private service: OptionsToolService, public store: OptionStore) {
    this.subscribeToDbChanges();
    this.addSubheaderColumns();
  }


/**
 * Initiates image sharing process, updating UI accordingly.
 */
  public async sharePicture() {
    this.shareDisabled = true;
    this.status = 'Preparing image....';
    await _wait(200);

    try {
      await this.store.shareAsImage();
      this.shareDisabled = false;
      this.status = 'share';
    } catch (error: any) {
      this.status = error?.message || 'Unable to share';
      this.shareDisabled = false;
    }
  }

  /** Initialise service and subscribe to data changes */
  private async subscribeToDbChanges() {
    await this.service.initialise();
    // create a live query to retrieve all docs on data change
    // pipe subscription to complete when component destroyed (avoids memory leak)
    const query = this.service.dbUserCollection;
    query.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((docs) => {
      this.dbDataDocs = docs;
    });
  }

  /**
   * Add mat-table identifiers for all subheader columns that will appear below the main heading row
   * As only some header rows want a subheader use a fallback 'default_subheader' templated in component html
   */
  private addSubheaderColumns() {
    const enabledSubheaders = ['performance', 'investment'];
    this.subheaderColumns = this.displayedColumns.map((name) =>
      enabledSubheaders.includes(name) ? `${name}_subheader` : `default_subheader`
    );
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
      await this.service.addORUpdateData(data);
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
