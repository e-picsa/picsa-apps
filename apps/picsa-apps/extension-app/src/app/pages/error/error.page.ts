import { Component } from '@angular/core';

@Component({
  selector: 'app-error',
  templateUrl: './error.page.html',
  styleUrls: ['./error.page.scss'],
})
export class ErrorPage {
  reloading: boolean;
  errorMessage: string;

  reloadPage() {
    this.reloading = true;
    window.location.reload();
  }
}
