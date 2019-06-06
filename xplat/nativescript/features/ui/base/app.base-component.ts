import { Component } from '@angular/core';

// libs
import { BaseComponent } from '@picsa/core';
import { AppService } from '@picsa/nativescript/core';

export abstract class AppBaseComponent extends BaseComponent {
  constructor(protected appService: AppService) {
    super();
  }
}
