import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FlyInOut } from '@picsa/shared/animations';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'picsa-manual-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [FlyInOut({ axis: 'Y' })],
})
export class HomeComponent implements OnDestroy {
  page?: number = undefined;

  private componentDestroyed$ = new Subject<boolean>();

  constructor(private route: ActivatedRoute) {
    this.route.queryParams.pipe(takeUntil(this.componentDestroyed$)).subscribe(({ page }) => {
      this.page = Number(page);
    });
  }

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }
}
