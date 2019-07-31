import { Component } from '@angular/core';

@Component({
  template: `
    <div style="height:100vh; display:flex; flex-direction:column">
      <station-data-header style="z-index:2"></station-data-header>
      <div style="display:flex; flex-basis:100%">
        <station-data-sidebar style="z-index:1"></station-data-sidebar>
        <div style="flex:1; padding:10px">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `
})
export class PagesComponent {}
