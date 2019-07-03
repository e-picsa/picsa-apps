import { Component } from '@angular/core';

@Component({
  template: `
    <div style="height:100vh; display:flex; flex-direction:column">
      <station-data-header></station-data-header>
      <div style="display:flex; flex-basis:100%">
        <station-data-sidebar></station-data-sidebar>
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class PagesComponent {}
