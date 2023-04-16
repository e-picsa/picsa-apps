import { Injectable, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { ConfigurationService, IConfiguration } from '@picsa/configuration';
import { APP_VERSION } from '@picsa/environments';
import { IAppMeta } from '@picsa/models';
import { generateDBMeta, PicsaDbService } from '@picsa/shared/services/core/db';
import { generateID } from '@picsa/shared/services/core/db/db.service';
import { PrintProvider } from '@picsa/shared/services/native/print';
import merge from 'deepmerge';
import { toJS } from 'mobx';
import { action, computed, observable } from 'mobx-angular';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';

import { BUDGET_CARDS } from '../data';
import {
  IBudget,
  IBudgetBalance,
  IBudgetCard,
  IBudgetCardDB,
  IBudgetCardWithValues,
  IBudgetCodeDoc,
  IBudgetMeta,
  IBudgetPeriodData,
  IBudgetPeriodType,
  IBudgetValueCounters,
  IBudgetValueScale,
} from '../models/budget-tool.models';
import { checkForBudgetUpgrades } from '../utils/budget.upgrade';
import { MONTHS, NEW_BUDGET_TEMPLATE } from './templates';
const TYPE_CARDS_BASE: {
  [key in IBudgetPeriodType | 'enterprise' | 'other']: IBudgetCard[];
} = {
  activities: [],
  familyLabour: [],
  inputs: [],
  outputs: [],
  produceConsumed: [],
  enterprise: [],
  other: [],
};
const TYPE_LABELS: { [key in IBudgetPeriodType | 'summary']: string } = {
  activities: translateMarker('Activities'),
  familyLabour: translateMarker('Family Labour'),
  inputs: translateMarker('Inputs'),
  outputs: translateMarker('Outputs'),
  produceConsumed: translateMarker('Produce Consumed'),
  summary: translateMarker('Summary'),
};
type IBudgetCounter = 'large' | 'large-half' | 'medium' | 'medium-half' | 'small' | 'small-half';
export type IBudgetCounterSVGIcons = Record<IBudgetCounter, SafeResourceUrl>;

@Injectable({
  providedIn: 'root',
})
export class BudgetStore implements OnDestroy {
  changes = new BehaviorSubject<[number, string]>([null, null] as any);
  public settings: IConfiguration.IBudgetToolSettings;
  private destroyed$ = new Subject<boolean>();
  public typeLabels = TYPE_LABELS;
  public counterSVGIcons: IBudgetCounterSVGIcons;

  @observable storeReady = false;
  @observable budgetCards: IBudgetCard[] = [];
  @observable activeBudget: IBudget = undefined as any;
  @observable activePeriod = 0;
  @observable activeType: IBudgetPeriodType = 'activities';
  @observable savedBudgets: IBudget[] = [];
  @observable valueCounters: IBudgetValueCounters = [[], []];
  @observable balance: IBudgetBalance = [];
  // get unique list of types in enterprise cards
  @computed get enterpriseTypeCards(): IBudgetCardDB[] {
    console.log('get enterprisetype cards');
    const enterpriseCards = this.budgetCards.filter((c) => c.type === 'enterprise');
    return this._createCardGroupCards(enterpriseCards);
  }
  @observable budgetCardsByType = TYPE_CARDS_BASE;

  @computed get budgetPeriodLabels(): string[] {
    return this._generateLabels(this.activeBudget.meta);
  }

  @action setActiveBudget(budget: IBudget) {
    this.activeBudget = budget;
  }
  @action calculateBalance() {
    this.balance = this._calculateBalance(this.activeBudget);
  }
  @action setActivePeriod(index: number) {
    this.activePeriod = index;
  }
  @action setActiveType(activeType: IBudgetPeriodType) {
    this.activeType = activeType;
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
    private db: PicsaDbService,
    private configurationService: ConfigurationService,
    private printPrvdr: PrintProvider,
    private sanitizer: DomSanitizer
  ) {
    this.counterSVGIcons = this.createBudgetCounterSVGs();
    // TODO store never destroyed so would be good to limit listeners
    this.configurationService.activeConfiguration$.pipe(takeUntil(this.destroyed$)).subscribe((v) => {
      this.settings = this.configurationService.activeConfiguration.budgetTool;
    });
  }
  ngOnDestroy(): void {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

  /**************************************************************************
   *            Enterprise methods
   *
   ***************************************************************************/
  getfilteredEnterprises(grouping: string) {
    return this.budgetCards.filter((e) => e.type === 'enterprise' && e.groupings?.includes(grouping));
  }
  /**************************************************************************
   *            Budget Values
   *
   ***************************************************************************/
  // merge current budget with added data, optionally can merge deep to include
  // nested properties
  patchBudget(patch: Partial<IBudget>, deepMerge = false) {
    const budget = deepMerge ? merge(this.activeBudget, patch) : { ...this.activeBudget, ...patch };
    this.setActiveBudget(budget);
    this.saveBudget();
  }
  // populate correct budget data based on editor data and current active cell
  saveEditor(data: IBudgetCardWithValues[], type: IBudgetPeriodType) {
    const period = this.activePeriod;
    // ensure clean write by cloning existing budget before updating deeply nested property
    const budgetData = JSON.parse(JSON.stringify(this.activeBudget.data));
    budgetData[period][type] = data;
    this.patchBudget({ data: budgetData });
    // use behaviour subject to provide better change detection binding on changes
    this.changes.next([period, type]);
    this.calculateBalance();
  }

  @action
  scaleValueCounters(scale: IBudgetValueScale) {
    const oldScale = this.activeBudget.meta.valueScale;
    const newScale = scale * oldScale;
    this.patchBudget({
      meta: { ...this.activeBudget.meta, valueScale: newScale },
    });
    this.valueCounters = this._generateValueCounters(this.activeBudget);
  }

  async saveCustomCard(card: IBudgetCard) {
    await this.db.setDoc('budgetTool/_all/cards', card);
    // re-populate budget cards
    console.log('card saved', card);
    await this.preloadData();
  }
  deleteCustomCard(card: IBudgetCardDB) {
    return this.db.deleteDocs('budgetTool/_all/cards', [card._key]);
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
    await this.loadSavedBudgets();
  }
  async loadBudgetByKey(key: string) {
    if (!this.activeBudget || this.activeBudget._key !== key) {
      await this.loadSavedBudgets();
      const budget = this.savedBudgets.find((b) => b._key === key);
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
    console.log('loading budget', budget);
    budget = checkForBudgetUpgrades(budget);
    this.valueCounters = this._generateValueCounters(budget);
    this.balance = this._calculateBalance(budget);
    this.setActiveBudget(budget);
  }

  private async loadSavedBudgets(): Promise<void> {
    const budgets = await this.db.getCollection<IBudget>('budgetTool/${GROUP}/budgets');
    this.savedBudgets = budgets.sort((a, b) => (b._modified > a._modified ? 1 : -1));
  }

  async deleteBudget(budget: IBudget) {
    await this.db.deleteDocs('budgetTool/${GROUP}/budgets', [budget._key]);
    if (budget.shareCode) {
      await this.db.deleteDocs('budgetTool/default/shareCodes', [budget.shareCode]);
    }
    this.loadSavedBudgets();
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
      this.activeBudget = budget;
      this.saveBudget();
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
    this.loadSavedBudgets();
    await this.checkForUpdates();
    await this.preloadData();
    this.storeReady = true;
  }

  // load the corresponding values into the budgetMeta observable
  @action
  private async preloadData() {
    const endpoint = 'budgetTool/_all/cards';
    this.budgetCards = await this.db.getCollection<IBudgetCard>(endpoint);
    this.budgetCards.forEach((card) => {
      if (!this.budgetCardsByType[card.type]) {
        console.log('missing budget card type', card.type);
        this.budgetCardsByType[card.type] = [];
      }
      this.budgetCardsByType[card.type].push(card);
    });
  }
  // check for latest app version initialised. If this one is different then
  // attempt to reload any hardcoded data present in the app
  private async checkForUpdates() {
    const version = await this.db.getDoc<IAppMeta>('_appMeta', 'VERSION');
    const updateRequired = !version || version.value !== APP_VERSION.number;
    if (updateRequired) {
      await this.setHardcodedData();
      const update: IAppMeta = { _key: 'VERSION', value: APP_VERSION.number };
      this.db.setDoc('_appMeta', update);
    }
  }

  private async setHardcodedData() {
    const endpoint = 'budgetTool/_all/cards';
    const docs: IBudgetCardDB[] = BUDGET_CARDS.map((card) => {
      return {
        ...card,
        // add doc metadata - this would be auto populated however want to keep
        // reference of app version date so can be overwritten by db if desired
        _created: new Date(APP_VERSION.date).toISOString(),
        _modified: new Date(APP_VERSION.date).toISOString(),
        _key: `${card.type}_${card.id}`,
      };
    });
    await this.db.setDocs(endpoint, docs);
  }

  /**************************************************************************
   *            Calculation Methods
   *
   ***************************************************************************/

  private _calculateBalance(budget: IBudget): IBudgetBalance {
    // total for current period
    const totals: { period: number; running: number }[] = [];
    let runningTotal = 0;
    budget.data.forEach((period, i) => {
      const periodTotal = this._calculatePeriodTotal(period);
      runningTotal = runningTotal + periodTotal;
      totals[i] = {
        period: periodTotal,
        running: runningTotal,
      };
    });
    return totals;
  }
  private _calculatePeriodTotal(period: IBudgetPeriodData) {
    let balance = 0;
    const inputCards = Object.values(period.inputs);
    const inputsBalance = this._calculatePeriodCardTotals(inputCards);
    const outputCards = Object.values(period.outputs);
    const outputsBalance = this._calculatePeriodCardTotals(outputCards);
    balance = outputsBalance - inputsBalance;
    return balance;
  }
  private _calculatePeriodCardTotals(cards: IBudgetCard[]) {
    let total = 0;
    cards.forEach((card) => {
      const t = card.values?.total ? card.values.total : 0;
      total = total + t;
    });
    return total;
  }

  /**************************************************************************
   *           Helper Methods
   *
   ***************************************************************************/

  // create list of labels depending on scale, total and start, e.g. ['week 1','week 2'] or ['Sep','Oct','Nov']
  private _generateLabels(meta: IBudgetMeta): string[] {
    const { lengthScale, lengthTotal, monthStart = 1 } = meta;
    if (lengthScale === 'weeks') {
      return new Array(lengthTotal).fill(0).map((_, i) => 'Week ' + (i + 1));
    }
    if (lengthScale === 'days') {
      return new Array(lengthTotal).fill(0).map((_, i) => 'Day ' + (i + 1));
    }
    if (lengthScale === 'months') {
      // duplicate array so that can still slice up to 12 months from dec
      const base = [...MONTHS, ...MONTHS];
      return base.slice(monthStart - 1, lengthTotal + monthStart - 1);
    }
    return [];
  }
  // group all enterprise cards and create new parent card that will be used to reveal group
  private _createCardGroupCards(cards: IBudgetCard[]): IBudgetCardDB[] {
    const allGroupings: string[][] = cards.map((e) => toJS(e.groupings) as string[]);
    // eslint-disable-next-line prefer-spread
    const mergedGroupings: string[] = ([] as any).concat.apply([], allGroupings);
    // NOTE - technically Array.from shouldn't be required but current issue with typescript
    // see https://stackoverflow.com/questions/33464504/using-spread-syntax-and-new-set-with-typescript/33464709
    const uniqueGroups = [...Array.from(new Set(mergedGroupings))].sort();
    const enterpriseTypeCards: IBudgetCardDB[] = uniqueGroups.map((group) => {
      return {
        id: group,
        label: group,
        type: 'enterprise',
        imgType: 'svg',
        _key: `_group_${group}`,
        _created: new Date().toISOString(),
        _modified: new Date().toISOString(),
      };
    });
    return enterpriseTypeCards;
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
