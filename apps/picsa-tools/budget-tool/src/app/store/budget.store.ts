/* eslint-disable @nx/enforce-module-boundaries */
import { effect, Injectable } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { ConfigurationService } from '@picsa/configuration';
import { IDeploymentSettings, MONTH_DATA } from '@picsa/data';
import { APP_VERSION } from '@picsa/environments';
import { IAppMeta } from '@picsa/models';
import { PicsaDialogService } from '@picsa/shared/features';
import { generateDBMeta, PicsaDbService } from '@picsa/shared/services/core/db';
import { generateID } from '@picsa/shared/services/core/db/db.service';
import { PrintProvider } from '@picsa/shared/services/native/print';
import merge from 'deepmerge';
import { toJS } from 'mobx';
import { action, observable } from 'mobx-angular';
import { BehaviorSubject } from 'rxjs';

import {
  IBudget,
  IBudgetCodeDoc,
  IBudgetMeta,
  IBudgetPeriodType,
  IBudgetValueCounters,
  IBudgetValueScale,
} from '../models/budget-tool.models';
import { IBudgetCard, IBudgetCardWithValues } from '../schema';
import { checkForBudgetUpgrades } from '../utils/budget.upgrade';
import { BudgetService } from './budget.service';
import { NEW_BUDGET_TEMPLATE, PERIOD_DATA_TEMPLATE } from './templates';

type IBudgetCounter = 'large' | 'large-half' | 'medium' | 'medium-half' | 'small' | 'small-half';
export type IBudgetCounterSVGIcons = Record<IBudgetCounter, SafeResourceUrl>;

@Injectable({
  providedIn: 'root',
})
export class BudgetStore {
  changes = new BehaviorSubject<[number, string]>([null, null] as any);
  public settings: IDeploymentSettings['budgetTool'];
  public counterSVGIcons: IBudgetCounterSVGIcons;

  @observable storeReady = false;
  @observable budgetCards: IBudgetCard[] = [];
  @observable activeBudget: IBudget = undefined as any;
  @observable valueCounters: IBudgetValueCounters = [[], []];

  @observable periodLabels: string[] = [];

  @action setActiveBudget(budget: IBudget) {
    this.activeBudget = budget;
    this.periodLabels = this.generatePeriodLabels(budget.meta);
    this.service.budgetData.set(budget.data);
  }

  /** Reset default budget values */
  @action unloadActiveBudget() {
    this.activeBudget = undefined as any;
    this.valueCounters = [[], []];
  }
  get activeBudgetValue() {
    return toJS(this.activeBudget);
  }
  // enterprises only have a single group which is used during card filtering
  get enterpriseGroup() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.activeBudget.meta.enterprise.groupings![0];
  }

  constructor(
    private service: BudgetService,
    private db: PicsaDbService,
    private printPrvdr: PrintProvider,
    private sanitizer: DomSanitizer,
    private dialogService: PicsaDialogService,
    private componentService: PicsaCommonComponentsService,
    configurationService: ConfigurationService,
  ) {
    this.counterSVGIcons = this.createBudgetCounterSVGs();
    effect(() => {
      const { budgetTool } = configurationService.deploymentSettings();
      this.settings = budgetTool;
    });
  }

  /**************************************************************************
   *            Budget Values
   *
   ***************************************************************************/
  // merge current budget with added data, optionally can merge deep to include
  // nested properties
  async patchBudget(patch: Partial<IBudget>, deepMerge = false) {
    const budget = deepMerge ? merge(this.activeBudget, patch) : { ...this.activeBudget, ...patch };
    this.setActiveBudget(budget);
    return this.saveBudget();
  }
  // populate correct budget data based on editor data and current active cell
  saveEditor(data: IBudgetCardWithValues[], type: IBudgetPeriodType) {
    const period = this.service.activePeriod();
    // ensure clean write by cloning existing budget before updating deeply nested property
    const budgetData = JSON.parse(JSON.stringify(this.activeBudget.data));
    budgetData[period][type] = data;
    this.patchBudget({ data: budgetData });
    // use behaviour subject to provide better change detection binding on changes
    this.changes.next([period, type]);
  }

  @action
  scaleValueCounters(scale: IBudgetValueScale) {
    const oldScale = this.activeBudget.meta.valueScale;
    const newScale = scale * oldScale;
    this.patchBudget({
      meta: { ...this.activeBudget.meta, valueScale: newScale },
    });
    this.valueCounters = this._generateValueCounters(this.activeBudget);
    // patch budget to trigger icon reprocessing
    this.patchBudget({}, true);
  }

  /**
   * Create inline SVGs for the default budget icons for faster load
   * (also available in assets for reference)
   */
  private createBudgetCounterSVGs() {
    const svgs: IBudgetCounterSVGIcons = {} as any;
    // Create svgs based on the following paths (adapted from .svg file)
    const svgPaths = {
      large:
        'M479.99952 480.00078c-149.33319.00002-298.66639.00002-447.999582 0C106.66653 330.6673 181.33313 181.33382 255.99974 32.00035c74.66661 149.33347 149.3332 298.66695 223.99978 448.00043Z',
      medium: 'M41.695065 41.695068H470.30496c-.00001 142.869952 0 285.739912 0 428.609862H41.695065V41.695068z',
      small:
        'M460.09621 256c5.02545 132.35505-139.57369 238.73445-264.41078 194.98057C67.841246 416.64296 8.7177668 247.12958 87.552104 140.7586 158.13858 28.727575 337.53963 22.374453 415.87405 129.13175 444.36362 164.8484 460.20746 210.31914 460.09621 256Z',
    };
    for (const [name, path] of Object.entries(svgPaths)) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 512 512');
      const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      iconPath.setAttribute('d', path);
      iconPath.setAttribute('fill', '#c5ceb2');
      iconPath.setAttribute('stroke', '#77933c');
      iconPath.setAttribute('stroke-width', '100');
      iconPath.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(iconPath);
      svgs[`${name}`] = this.sanitizer.bypassSecurityTrustHtml(svg.outerHTML);
      // Create a half-style el where viewbox cuts off half of element
      const halfEl = svg.cloneNode(true) as SVGElement;
      halfEl.setAttribute('viewBox', '0 0 256 512');
      svgs[`${name}-half`] = this.sanitizer.bypassSecurityTrustHtml(halfEl.outerHTML);
    }
    return svgs;
  }

  /**************************************************************************
   *            Editor Mode
   *
   ***************************************************************************/

  public async editorAddTimePeriod() {
    const { data, meta } = this.activeBudget;
    this.activeBudget.meta.lengthTotal = meta.lengthTotal + 1;
    data.push(PERIOD_DATA_TEMPLATE);
    await this.patchBudget({ data });
  }
  public async editorDeleteTimePeriod(index: number) {
    const dialogRef = await this.dialogService.open('delete');
    dialogRef.afterClosed().subscribe(async (shouldDelete) => {
      if (shouldDelete) {
        const { meta, data } = this.activeBudget;
        this.activeBudget.meta.lengthTotal = meta.lengthTotal - 1;
        data.splice(index, 1);
        await this.patchBudget({ data });
      }
    });
  }
  public async editorCopyTimePeriod(index: number) {
    const { meta, data } = this.activeBudget;
    this.activeBudget.meta.lengthTotal = meta.lengthTotal + 1;
    data.splice(index, 0, JSON.parse(JSON.stringify(data[index])));
    await this.patchBudget({ data });
  }

  /**************************************************************************
   *            Budget Create/Save/Load
   *
   ***************************************************************************/

  createNewBudget() {
    const budget: IBudget = {
      ...NEW_BUDGET_TEMPLATE,
      ...generateDBMeta(),
    };
    this.valueCounters = this._generateValueCounters(budget);
    this.setActiveBudget(budget);
  }
  async saveBudget() {
    await this.db.setDoc('budgetTool/${GROUP}/budgets', this.activeBudgetValue, true);
  }
  async loadBudgetByKey(key: string) {
    if (!this.activeBudget || this.activeBudget._key !== key) {
      const budgets = await this.loadSavedBudgets();
      const budget = budgets.find((b) => b._key === key);
      if (budget) {
        this.loadBudget(toJS(budget));
      } else {
        await this.importBudget(key);
      }
    }
  }
  async loadBudgetByShareCode(code: string) {
    const codeDoc = await this.db.getDoc<IBudgetCodeDoc>('budgetTool/default/shareCodes', code, 'server');
    if (codeDoc) {
      return this.importBudget(codeDoc.budget_key);
    } else {
      console.warn('No budget share code found for code:', code);
      return undefined;
    }
  }
  async loadBudget(budget: IBudget) {
    budget = checkForBudgetUpgrades(budget);
    this.valueCounters = this._generateValueCounters(budget);
    this.setActiveBudget(budget);
    this.componentService.patchHeader({ title: budget.meta.title });
  }

  public async loadSavedBudgets() {
    const budgets = await this.db.getCollection<IBudget>('budgetTool/${GROUP}/budgets');
    return budgets.sort((a, b) => (b._modified > a._modified ? 1 : -1));
  }

  async deleteBudget(budget: IBudget) {
    await this.db.deleteDocs('budgetTool/${GROUP}/budgets', [budget._key]);
    if (budget.shareCode) {
      await this.db.deleteDocs('budgetTool/default/shareCodes', [budget.shareCode]);
    }
  }

  /** Duplicate a server budget and save locally */
  private async importBudget(key: string): Promise<IBudget | undefined> {
    const budget: IBudget = await this.db.getDoc('budgetTool/${GROUP}/budgets', key, 'server');
    if (budget) {
      // remove previous share code to allow re-share as new budget
      if (budget.shareCode) {
        delete budget.shareCode;
      }
      // append additional key to keep reference from parent to derived budgets
      const { _key } = generateDBMeta();
      budget._key += `_${_key}`;
      this.setActiveBudget(budget);
      await this.saveBudget();
    } else {
      console.warn('No budget doc found for key:', key);
    }
    return budget;
  }

  public async shareAsImage() {
    return this.printPrvdr.shareHtmlDom('#budget', this.activeBudget.meta.title, this.activeBudget.meta.title);
  }

  public async shareAsLink() {
    const { shareCode } = this.activeBudget;
    if (!shareCode) {
      const code = generateID(4, 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789');
      // TODO ensure share code doesn't already exist
      const budgetCodeDoc: IBudgetCodeDoc = {
        ...generateDBMeta(),
        _key: code,
        budget_key: this.activeBudget._key,
      };
      await this.db.setDoc('budgetTool/default/shareCodes', budgetCodeDoc, true);
      this.activeBudget.shareCode = code;
    }
    await this.saveBudget();
    return this.activeBudget.shareCode as string;
  }

  /**************************************************************************
   *            Initialisation
   *
   ***************************************************************************/
  @action
  public async init() {
    await this.checkForUpdates();
    this.storeReady = true;
  }

  // check for latest app version initialised. If this one is different then
  // attempt to reload any hardcoded data present in the app
  private async checkForUpdates() {
    const version = await this.db.getDoc<IAppMeta>('_appMeta', 'VERSION');
    const updateRequired = !version || version.value !== APP_VERSION.semver;
    if (updateRequired) {
      await this.setHardcodedData();
      const update: IAppMeta = { _key: 'VERSION', value: APP_VERSION.semver };
      this.db.setDoc('_appMeta', update);
    }
  }

  private async setHardcodedData() {
    // const endpoint = 'budgetTool/_all/cards';
    // const docs: IBudgetCard[] = BUDGET_CARDS.map((card) => {
    //   return {
    //     ...card,
    //     // add doc metadata - this would be auto populated however want to keep
    //     // reference of app version date so can be overwritten by db if desired
    //     _created: new Date(APP_VERSION.date).toISOString(),
    //     _modified: new Date(APP_VERSION.date).toISOString(),
    //     _key: `${card.type}_${card.id}`,
    //   };
    // });
    // await this.db.setDocs(endpoint, docs);
  }

  /**************************************************************************
   *           Helper Methods
   *
   ***************************************************************************/

  // create list of labels depending on scale, total and start, e.g. ['week 1','week 2'] or ['Sep','Oct','Nov']
  private generatePeriodLabels(meta: IBudgetMeta): string[] {
    const { lengthScale, lengthTotal, monthStart = 1 } = meta;
    const months = MONTH_DATA.map((m) => m.labelShort);
    if (lengthScale === 'weeks') {
      return new Array(lengthTotal).fill(0).map((_, i) => 'Week ' + (i + 1));
    }
    if (lengthScale === 'days') {
      return new Array(lengthTotal).fill(0).map((_, i) => 'Day ' + (i + 1));
    }
    if (lengthScale === 'months') {
      // duplicate array so that can still slice up to 12 months from dec
      const base = [...months, ...months];
      return base.slice(monthStart - 1, lengthTotal + monthStart - 1);
    }
    return [];
  }

  // each currency has a base unit (e.g. MK 1000) which is used to generate
  // counter representations in orders of 10 (i.e. 100, 1000, 10000) and half values.
  // These can additionaly be scaled up or down by magnitudes of 10.
  private _generateValueCounters(budget: IBudget) {
    const scale = budget.meta.valueScale;
    // use rounding to avoid annoying precious errors
    const { currencyBaseValue } = this.settings;
    const b = Math.round(currencyBaseValue * scale);
    // return as arrays to ensure order retained if iterating over
    const counters: IBudgetValueCounters = [
      ['large', 'large-half', 'medium', 'medium-half', 'small', 'small-half'],
      [10 * b, 5 * b, b, b / 2, b / 10, b / 20],
    ];
    return counters;
  }
}
