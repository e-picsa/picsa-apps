import { Injectable } from '@angular/core';
import { MOCK_FORMS } from '../../../data/forms/mock.forms';
import { arrayToHashmap } from '@picsa/utils';

@Injectable({ providedIn: 'root' })
export class MonitoringToolService {
  private formsById = arrayToHashmap(MOCK_FORMS, 'enketoId');

  public getForm(formId: string, entry?: string) {
    const form = this.formsById[formId];
    if (!form) {
      console.error('could not find form with id', formId);
      return undefined;
    }
    return form;
  }
}
