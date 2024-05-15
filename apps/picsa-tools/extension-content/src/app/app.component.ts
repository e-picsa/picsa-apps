import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterModule],
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'picsa-extension-content',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class PicsaExtensionContent {
  title = 'extension-content';
}
