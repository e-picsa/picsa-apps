import { Component } from '@angular/core';

@Component({
  template: `
    <station-data-header></station-data-header>
    <div style="display:flex">
      <station-data-sidebar></station-data-sidebar>
      <router-outlet></router-outlet>
    </div>
  `
})
export class PagesComponent {}
