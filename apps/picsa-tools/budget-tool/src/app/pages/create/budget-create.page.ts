import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { ANIMATION_DELAYED, FadeInOut } from '@picsa/shared/animations';

import { IBudgetMeta, IEnterpriseScaleLentgh } from '../../models/budget-tool.models';
import { IBudgetCard } from '../../schema';
import { BudgetStore } from '../../store/budget.store';
import { BudgetCardService } from '../../store/budget-card.service';
import { MONTHS, PERIOD_DATA_TEMPLATE } from '../../store/templates';

@Component({
  selector: 'budget-create',
  templateUrl: './budget-create.page.html',
  styleUrls: ['./budget-create.page.scss'],
  animations: [FadeInOut(ANIMATION_DELAYED)],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetCreatePage implements OnInit {
  budgetMetaForm: FormGroup;
  enterpriseToggle = false;
  selectedType: string;
  filteredEnterprises: IBudgetCard[] = [];
  periodScaleOptions: IEnterpriseScaleLentgh[] = ['weeks', 'months'];
  periodTotalOptions = new Array(12).fill(0).map((v, i) => i + 1);
  periodLabelOptions = [...MONTHS];
  enterpriseTypeCards: IBudgetCard[] = [];
  @ViewChild('stepper', { static: true }) stepper: MatStepper;
  constructor(
    private fb: FormBuilder,
    public store: BudgetStore,
    private router: Router,
    private route: ActivatedRoute,
    private cardService: BudgetCardService
  ) {}

  async ngOnInit() {
    this.store.createNewBudget();
    this.generateBudgetForm();
    this.enterpriseTypeCards = await this.cardService.getEnterpriseGroupCards();
  }

  /**************************************************************************
   *  Public Helpers
   **************************************************************************/

  async enterpriseTypeClicked(type: string) {
    // reset form on new type selected
    this.selectedType = type;
    this.enterpriseToggle = false;
    this.budgetMetaForm.patchValue({ enterprise: { type } });
    const filteredEnterprises = await this.getFilteredEnterprises(type);
    setTimeout(async () => {
      this.filteredEnterprises = filteredEnterprises;
      this.enterpriseToggle = true;
    }, 200);
  }

  enterpriseClicked(enterprise: IBudgetCard) {
    // TODO - defaults no longer set for each enterprise,
    // possibly find a way to store somewhere and lookup
    this.budgetMetaForm.patchValue({
      enterprise: enterprise,
    });
  }

  async customEnterpriseCreated(enterprise: IBudgetCard) {
    this.filteredEnterprises = await this.getFilteredEnterprises(this.selectedType);
    this.enterpriseClicked(enterprise);
  }
  private async getFilteredEnterprises(grouping: string) {
    const docs = await this.cardService.dbCollection.find({ selector: { type: 'enterprise' } }).exec();
    return docs.map((d) => d._data).filter((e) => e.groupings?.includes(grouping as any));
  }
  async save() {
    const meta = this.budgetMetaForm.value as IBudgetMeta;
    // generate period data
    const data = new Array(meta.lengthTotal).fill(PERIOD_DATA_TEMPLATE);
    await this.store.patchBudget({ data, meta });
    this.router.navigate(['../', 'view', this.store.activeBudget._key], {
      relativeTo: this.route,
    });
  }

  public trackByFn(index: number, item: IBudgetCard) {
    return item.id;
  }

  /**************************************************************************
   *  Private Generators & Helpers
   **************************************************************************/

  // create general form with formgroups for all budget fields
  // add required vaildation for fields which must be completed in this page
  private generateBudgetForm() {
    const requiredFields1: IBudgetMetaKey[] = ['enterprise', 'title', 'lengthScale'];
    this.budgetMetaForm = this._generateFormFromValues(this.store.activeBudget.meta, requiredFields1);
  }

  // custom method to generate simple form from json object and populate with provided initial values
  // accepts array of fields to add required validators too
  private _generateFormFromValues(v: any, requiredFields: string[] = []) {
    const fieldGroup = {};
    Object.keys(v).forEach(
      (key) => (fieldGroup[key] = [v[key], requiredFields.includes(key) ? Validators.required : null])
    );
    return this.fb.group(fieldGroup);
  }
}

// need to specify only string keys as technically could be numbers (change in ts 2.9)
type IBudgetMetaKey = Extract<keyof IBudgetMeta, string>;
