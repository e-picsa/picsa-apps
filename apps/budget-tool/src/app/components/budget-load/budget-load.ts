import { select } from "@angular-redux/store";
import { Component, OnDestroy } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { BudgetToolActions } from "../../store/budget-tool.actions";
import { IBudget } from "../../models/budget-tool.models";
import { PB_MOCK_API_2, PB_MOCK_API_3 } from "../../mocks/budget.mocks";
import { Router, ActivatedRoute } from "@angular/router";

@Component({
  selector: "budget-load",
  templateUrl: `budget-load.html`
})
export class BudgetLoadComponent implements OnDestroy {
  private componentDestroyed: Subject<any> = new Subject();
  _adminBudgets = [PB_MOCK_API_2, PB_MOCK_API_3];
  @select(["budget", "active"])
  budget$: Observable<IBudget>;
  @select(["user", "budgets"])
  savedBudgets$: Observable<IBudget[]>;
  savedBudgets: IBudget[];
  showArchived: boolean;
  constructor(
    public actions: BudgetToolActions,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  ngOnInit() {
    this.savedBudgets$
      .pipe(takeUntil(this.componentDestroyed))
      .subscribe(budgets => {
        if (budgets) {
          this.savedBudgets = Object.values(budgets);
          console.log("saved budgets", budgets);
        }
      });
  }
  ngOnDestroy() {
    this.componentDestroyed.next();
    this.componentDestroyed.unsubscribe();
  }
  startNew() {
    this.router.navigate(["create"], { relativeTo: this.route });
  }

  showArchivedBudgets() {
    this.showArchived = true;
  }
}
