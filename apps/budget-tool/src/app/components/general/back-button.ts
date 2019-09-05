import { Component, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'back-button',
  template: `
    <button
      *ngIf="showButton"
      mat-button
      (click)="back()"
      style="position: absolute"
    >
      <mat-icon>arrow_back</mat-icon>Back
    </button>
  `,
  styles: [
    `
      :host {
        position: absolute;
        left: 0;
        top: 12px;
      }
    `
  ]
})
export class BackButton implements OnDestroy {
  route$: Subscription;
  showButton: Boolean;
  constructor(private router: Router, private route: ActivatedRoute) {
    this.route$ = this.router.events.subscribe(e => {
      if (e instanceof NavigationStart) {
        this.checkButtonState();
      }
    });
  }
  ngOnInit(): void {
    this.checkButtonState();
  }
  checkButtonState() {
    const url = this.router.url;
    this.showButton = url.split('/').length > 2;
  }

  back() {
    this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
  }

  ngOnDestroy(): void {
    this.route$.unsubscribe();
  }
}
