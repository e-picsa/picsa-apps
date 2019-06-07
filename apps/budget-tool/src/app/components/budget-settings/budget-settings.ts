import { NgRedux, select } from '@angular-redux/store';
import { Component, OnDestroy, ViewChild, OnInit } from '@angular/core';
import { Events, IonSlides } from '@ionic/angular';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DAYS, MONTHS } from '@picsa/core/services/translations';
import { AppState } from '@picsa/core/models';
import { BudgetToolActions } from '../../store/budget-tool.actions';
import {
  IBudget,
  IBudgetCard,
  ICustomBudgetCard
} from '../../models/budget-tool.models';
import { BudgetToolProvider } from '../../services/budget-tool.provider';

@Component({
  selector: 'budget-settings',
  templateUrl: 'budget-settings.html'
})
export class BudgetSettingsComponent implements OnDestroy, OnInit {
  private componentDestroyed: Subject<any> = new Subject();
  // budget property observers
  @select(['budget', 'active', 'enterpriseType'])
  enterpriseType$: Observable<string>;
  @select(['budget', 'active'])
  budget$: Observable<IBudget>;
  @select(['budget', 'active', 'enterprise'])
  enterprise$: Observable<string>;
  @select(['budget', 'active', 'periods', 'scale'])
  timescale$: Observable<string>;
  @select(['budget', 'meta', 'enterprises'])
  enterprises$: Observable<ICustomBudgetCard[]>;
  @select(['user', 'budgetCustomCards', 'enterprises'])
  customEnterprises$: Observable<ICustomBudgetCard[]>;
  @select(['budget', 'active', 'created'])
  created$: Observable<string>;
  // additional properties
  metaEnterprises: IBudgetCard[] = [];
  customEnterprises: IBudgetCard[] = [];
  allEnterprises: IBudgetCard[] = [];
  filteredEnterprises: IBudgetCard[] = [];
  showIndividualEnterprises: boolean;
  timescales = ['Days', 'Weeks', 'Months'];
  // note, keeping days and months hardcoded in english instead of translate, using translate pipe
  days = DAYS;
  months = MONTHS;
  enterpriseTypes: IBudgetCard[] = [];
  budget: IBudget;
  @ViewChild(IonSlides, { static: false }) slides: IonSlides;

  constructor(
    public actions: BudgetToolActions,
    public ngRedux: NgRedux<AppState>,
    public budgetPrvdr: BudgetToolProvider,
    private events: Events
  ) {}

  ngOnInit() {
    this._addSubscribers();
  }

  ngOnDestroy() {
    this.componentDestroyed.next();
    this.componentDestroyed.unsubscribe();
  }

  // various listeners for budget change actions
  _addSubscribers() {
    this.enterpriseType$
      .pipe(takeUntil(this.componentDestroyed))
      .subscribe(type => {
        this._filterEnterprises(type, this.allEnterprises);
      });
    // update enterprise types and filter list when enterprises changes
    this.enterprises$
      .pipe(takeUntil(this.componentDestroyed))
      .subscribe(enterprises => {
        if (enterprises) {
          this.metaEnterprises = enterprises;
          this.enterprisesInit();
        }
      });
    this.customEnterprises$
      .pipe(takeUntil(this.componentDestroyed))
      .subscribe(enterprises => {
        if (enterprises) {
          this.customEnterprises = enterprises;
          this.enterprisesInit();
        }
      });
    // *** including event subscriber as redux doesn't seem to update - need to resolve why
    this.events.subscribe('customCards:updated', customCards => {
      if (customCards && customCards.enterprises) {
        this.customEnterprises = customCards.enterprises;
        this.enterprisesInit();
      }
    });
    // calculate time periods when new timescale specified
    this.timescale$
      .pipe(takeUntil(this.componentDestroyed))
      .subscribe(scale => {
        if (scale) {
          this.calculatePeriod(scale);
        }
      });
    this.budget$.pipe(takeUntil(this.componentDestroyed)).subscribe(budget => {
      this.budget = budget;
    });
  }
  enterprisesInit() {
    this.allEnterprises = this.metaEnterprises.concat(this.customEnterprises);
    this.enterpriseTypes = this._generateEnterpriseTypes(this.allEnterprises);
    const type = this.budget ? this.budget.enterpriseType : null;
    this._filterEnterprises(type, this.allEnterprises);
  }

  // iterate over enterprises and populate groups that exist
  // always populate the 'other/custom' group
  _generateEnterpriseTypes(enterprises: IBudgetCard[]) {
    const groups: any = { other: true };
    enterprises.forEach(enterprise => {
      groups[enterprise.type] = true;
    });
    // convert to array, sort alphabetically and move 'other' group to end
    let types: string[] = Object.keys(groups);
    types = this._sortAlphabetcially(types);
    types.push(types.splice(types.indexOf('other'), 1)[0]);
    // finally convert to standard budget card format
    const typeCards: IBudgetCard[] = types.map(type => {
      return {
        id: type,
        name: type
      };
    });
    return typeCards;
  }
  // when enterprise type changed only show relevant enterprises
  // if there is only one sub type assume that is the one selected (unless other/custom)
  _filterEnterprises(type: string, enterprises: IBudgetCard[]) {
    this.showIndividualEnterprises = false;
    if (type) {
      enterprises = enterprises.filter(e => {
        return e.type === type;
      });
      this.filteredEnterprises = this._sortByField(enterprises, 'name');
      if (type === 'other') {
        this.showIndividualEnterprises = true;
      } else {
        // when only one result set it as type
        if (enterprises.length === 1) {
          this.budgetPrvdr.patchBudget('enterprise', enterprises[0].id);
        } else {
          // otherwise set enterprise as null (if not already defined)
          this.showIndividualEnterprises = true;
          if (!this.budget || !this.budget.enterprise) {
            this.budgetPrvdr.patchBudget('enterprise', null);
          }
        }
      }
    } else {
      this.budgetPrvdr.patchBudget('enterprise', null);
    }
  }
  _sortAlphabetcially(arr: string[]) {
    return arr.sort((a, b) => {
      return a > b ? 1 : -1;
    });
  }

  _sortByField(arr: any[], field) {
    return arr.sort((a, b) => {
      return a[field] > b[field] ? 1 : -1;
    });
  }

  nextSlide() {
    this.slides.slideNext();
  }

  viewBudget() {
    console.log('view budget');
    this.actions.setActiveBudget(this.budget);
    this.actions.setBudgetView({
      component: 'overview',
      title: this.budget.title
    });
  }

  calculatePeriod(timescale?) {
    // const budget = this.store.activeBudget;
    // // return array representing time periods
    // const starting = budget.periods.starting;
    // const total = budget.periods.total;
    // if (!timescale) {
    //   timescale = budget.periods.scale;
    // }
    // console.log('calculate period', timescale);
    // let arr = [];
    // if (timescale === 'Months') {
    //   budget.periods.total = total ? total : 12;
    //   budget.periods.starting = MONTHS.includes(starting)
    //     ? starting
    //     : MONTHS[0];
    //   arr = this.calculatePeriodMonths(total, starting);
    // }
    // if (timescale === 'Days') {
    //   budget.periods.starting = DAYS.includes(starting) ? starting : 'Monday';
    //   budget.periods.total = total ? total : 7;
    //   arr = this.calculatePeriodDays(total, starting);
    // }
    // if (timescale === 'Weeks') {
    //   budget.periods.starting = null;
    //   budget.periods.total = 4;
    //   arr = this.calculatePeriodConsecutive(total, 'week');
    // }
    // if (timescale === 'none') {
    //   arr = this.calculatePeriodConsecutive(total);
    // }
    // budget.periods.labels = arr;
  }
  calculatePeriodConsecutive(total, prefix?) {
    if (!prefix) {
      prefix = '';
    }
    const arr = [];
    for (let i = 1; i <= total; i++) {
      arr.push(prefix + i);
    }
    return arr;
  }
  calculatePeriodMonths(total, starting) {
    let array = MONTHS;
    if (starting) {
      const startIndex = MONTHS.indexOf(starting);
      for (let i = 0; i < startIndex; i++) {
        array.push(array.shift());
      }
    }
    if (total > array.length) {
      for (let i = 0; i < Math.ceil(total / array.length); i++) {
        array = array.concat(array);
      }
    }
    return array.slice(0, total);
  }
  calculatePeriodDays(total, starting) {
    let array = DAYS;
    if (starting) {
      const startIndex = DAYS.indexOf(starting);
      for (let i = 0; i < startIndex; i++) {
        array.push(array.shift());
      }
    }
    if (total > array.length) {
      for (let i = 0; i < Math.ceil(total / array.length); i++) {
        array = array.concat(array);
      }
    }
    return array.slice(0, total);
  }

  clearPeriodInput() {
    this.budget.periods.total = null;
  }
}
