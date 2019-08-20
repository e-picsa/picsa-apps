import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-error',
  templateUrl: './error.page.html',
  styleUrls: ['./error.page.scss']
})
export class ErrorPage implements OnInit {
  reloading: boolean;
  errorMessage: string;
  constructor() {}

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    // this.errorMessage = this.ngRedux.getState().platform.error;
  }

  reloadPage() {
    this.reloading = true;
    window.location.reload();
  }
}
