import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n/src';
import { _wait } from '@picsa/utils/browser.utils';
import { RxDocument } from 'rxdb';

import { EditorComponent } from '../../components/editor/editor.component';
import { GenderInputComponent } from '../../components/editor/inputs/gender/gender-input';
import { InvestmentInputComponent } from '../../components/editor/inputs/investment/investment-input';
import { PerformanceInputComponent } from '../../components/editor/inputs/performance/performance-input';
import { OptionMaterialModule } from '../../components/material.module';
import { ENTRY_TEMPLATE, IOptionsToolEntry } from '../../schemas';
import { OptionsToolService } from '../../services/options-tool.service';

@Component({
  selector: 'option-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],

  imports: [
    GenderInputComponent,
    PerformanceInputComponent,
    InvestmentInputComponent,
    PicsaTranslateModule,
    OptionMaterialModule,
    EditorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements AfterViewInit {
  private service = inject(OptionsToolService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  public optionsDisplayList: IOptionsToolEntry[] = [];

  /** List of columns to display in table. Note, order will match template keys */
  public displayedColumns = Object.keys(ENTRY_TEMPLATE()).filter((key) => !key.startsWith('_') && key !== 'enterprise');

  /** List of columns to display subheader row for */
  public subheaderColumns: string[];

  public dbDataDocs = signal<RxDocument<IOptionsToolEntry>[]>([]);
  public matStepperOpen = signal(false);

  private editorIndex = 0;

  public status = signal('share');
  public shareDisabled = signal(false);

  /** Option name from route */
  option: string;

  editorComponent = viewChild(EditorComponent);
  headerContent = viewChild<ElementRef<HTMLElement>>('headerContent');

  constructor() {
    this.addSubheaderColumns();
  }

  async ngAfterViewInit() {
    const enterprise = this.route.snapshot.paramMap.get('enterprise');
    await this.service.ready();
    this.subscribeToDbChanges((enterprise as IOptionsToolEntry['enterprise']) || 'crop');
  }

  /**
   * Initiates image sharing process, updating UI accordingly.
   */
  public async sharePicture() {
    this.shareDisabled.set(true);
    this.status.set('Preparing image....');
    await _wait(200);

    try {
      await this.service.shareAsImage();
      this.status.set('share');
    } catch (error: any) {
      this.status.set(error?.message || 'Unable to share');
    } finally {
      this.shareDisabled.set(false);
    }
  }

  /** Initialise service and subscribe to data changes */
  private subscribeToDbChanges(enterprise: IOptionsToolEntry['enterprise']) {
    // create a live query to retrieve all docs on data change
    const query = this.service.dbUserCollection;

    // pipe subscription to complete when component destroyed (avoids memory leak)
    query.$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((docs) => {
      // Filter the documents based on the 'option' value and 'enterprise' field
      this.dbDataDocs.set(docs.filter((doc) => doc.enterprise === enterprise));
    });
  }

  /**
   * Add mat-table identifiers for all subheader columns that will appear below the main heading row
   * As only some header rows want a subheader use a fallback 'default_subheader' templated in component html
   * adapted from https://stackoverflow.com/q/56724439
   */
  private addSubheaderColumns() {
    const enabledSubheaders = ['performance', 'investment'];
    this.subheaderColumns = this.displayedColumns.map((name) =>
      enabledSubheaders.includes(name) ? `${name}_subheader` : `default_subheader`,
    );
  }

  public openDialog() {
    this.matStepperOpen.set(true);
  }

  public closeDialog() {
    this.matStepperOpen.set(false);
  }

  async onDataTransfer(data: IOptionsToolEntry | null) {
    if (data) {
      console.log('transfer', { data });
      await this.service.addORUpdateData(data);
    } else {
      // remove any existing entry entry if no data passed back
      //delete from db
      const currentDocs = this.dbDataDocs();
      if (currentDocs[this.editorIndex]) {
        await this.service.deleteOption(currentDocs[this.editorIndex]);
      }
    }
    this.closeDialog();
  }

  openNewDialog() {
    this.editorIndex = this.dbDataDocs().length;
    this.editorComponent()?.resetVariables();
    this.openDialog();
  }

  onRowClicked(row: RxDocument<IOptionsToolEntry>, index: number) {
    this.editorIndex = index;
    this.editorComponent()?.presetVariables(row._data);
    this.openDialog();
  }
}
