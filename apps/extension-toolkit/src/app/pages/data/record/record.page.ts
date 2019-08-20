import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IUser, IForm, IFormDB } from '../../../models/models';
import { FormStore } from '../../../store/form.store';

@Component({
  selector: 'app-record',
  templateUrl: './record.page.html',
  styleUrls: ['./record.page.scss']
})
export class RecordPage {
  user: IUser;
  forms: IForm[];
  constructor(private router: Router, private formStore: FormStore) {}

  // when user updated check for available forms (given user group access permissions) and updated submissions
  // only show forms which are marked as active
  init(user: IUser) {
    this.user = user;
    try {
      const allForms: IForm[] = this.formStore.forms;
      console.log('forms', allForms);
      let forms = allForms.filter(form => {
        // only filter forms which has groups specified (otherwise assume available to all)
        if (form.groups) {
          return this._containsCommonElement(form.groups, this.user.groups);
        } else {
          return true;
        }
      });
      // also filter out inactive
      forms = forms.filter(form => {
        return form.isActive;
      });
      this.forms = forms;
      console.log('forms', this.forms);
    } catch (error) {
      console.error(error);
    }
  }

  async openForm(form: IFormDB) {
    this.router.navigate(['/data/record', form._key]);
  }

  // take 2 string arrays and return whether at least one element is shared between them
  _containsCommonElement(arr1: string[], arr2: string[] = []) {
    let common = false;
    console.log('checking common', arr1, arr2);
    arr1.forEach(el => {
      if (arr2.includes(el)) {
        common = true;
      }
    });
    console.log('common?', common);
    return common;
  }
}
