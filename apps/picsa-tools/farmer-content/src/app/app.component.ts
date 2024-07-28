import { Component } from '@angular/core';
// import { RouterOutlet } from '@angular/router';

@Component({
  // TODO - see if possible to use standalone with tool routing
  // standalone: true,
  // imports: [RouterOutlet],

  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'picsa-farmer-content',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class PicsaFarmerContent {
  title = 'farmer-content';
}
