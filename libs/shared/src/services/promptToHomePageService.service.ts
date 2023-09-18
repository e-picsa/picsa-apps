// Service to facilitate communication between the app-open-prompt and homepage

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommunicationService {
  private userEventSubject = new Subject<void>();

  userEvent$ = this.userEventSubject.asObservable();

  triggerUserEvent(): void {
    this.userEventSubject.next();
  }
}
