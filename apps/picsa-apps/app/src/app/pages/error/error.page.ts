import { Component } from '@angular/core';

@Component({
  selector: 'app-error',
  templateUrl: './error.page.html',
  styleUrls: ['./error.page.scss'],
  standalone: false,
})
export class ErrorPage {
  reloading: boolean;
  errorMessage: string;

  reloadPage() {
    this.reloading = true;
    window.location.reload();
  }
}
