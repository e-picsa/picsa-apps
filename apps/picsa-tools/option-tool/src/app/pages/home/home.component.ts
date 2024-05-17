import { DomPortal } from '@angular/cdk/portal';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { _wait } from '@picsa/utils/browser.utils';
import { RxDocument } from 'rxdb';
import { Subject, takeUntil } from 'rxjs';

// import { Observable } from 'rxjs';
import { EditorComponent } from '../../components/editor/editor.component';
import { ENTRY_TEMPLATE, IOptionsToolEntry } from '../../schemas';
import { OptionsToolService } from '../../services/options-tool.service';
@Component({
  selector: 'option-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  public optionsDisplayList: IOptionsToolEntry[] = [];

  /** List of columns to display in table. Note, order will match template keys */
  public displayedColumns = Object.keys(ENTRY_TEMPLATE()).filter((key) => !key.startsWith('_') && key !== 'enterprise');

  /** List of columns to display subheader row for */
  public subheaderColumns: string[];

  public dbDataDocs: RxDocument<IOptionsToolEntry>[] = [];
  public matStepperOpen = false;

  private editorIndex = 0;
  private componentDestroyed$ = new Subject();

  public status = 'share';
  public shareDisabled = false;

  /** Option name from route */
  option: string;

  @ViewChild(EditorComponent) editorComponent: EditorComponent;
  @ViewChild('headerContent')
  headerContent: ElementRef<HTMLElement>;

  constructor(
    private service: OptionsToolService,
    private componentService: PicsaCommonComponentsService,
    private route: ActivatedRoute
  ) {
    this.addSubheaderColumns();
  }

  async ngAfterViewInit() {
    this.componentService.patchHeader({
      endContent: new DomPortal(this.headerContent),
    });
    const enterprise = this.route.snapshot.paramMap.get('enterprise');
    await this.service.ready();
    this.subscribeToDbChanges((enterprise as IOptionsToolEntry['enterprise']) || 'crop');
  }

  /**
   * Initiates image sharing process, updating UI accordingly.
   */
  public async sharePicture() {
    this.shareDisabled = true;
    this.status = 'Preparing image....';
    await _wait(200);

    try {
      await this.service.shareAsImage();
      this.shareDisabled = false;
      this.status = 'share';
    } catch (error: any) {
      this.status = error?.message || 'Unable to share';
      this.shareDisabled = false;
    }
  }

  /** Initialise service and subscribe to data changes */
  private subscribeToDbChanges(enterprise: IOptionsToolEntry['enterprise']) {
    // create a live query to retrieve all docs on data change
    // pipe subscription to complete when component destroyed (avoids memory leak)
    const query = this.service.dbUserCollection;
    query.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((docs) => {
      // Filter the documents based on the 'option' value and 'enterprise' field
      this.dbDataDocs = docs.filter((doc) => doc.enterprise === enterprise);
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
      console.log('transfer', { data });
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
