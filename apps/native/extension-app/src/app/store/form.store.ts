// Whilst project has angular-redux throughout, also planning migration to mobx with initial modules

import { observable, action } from 'mobx-angular';
import { toJS } from 'mobx';
import { Injectable } from '@angular/core';
import { IForm, IFormResponse, IFormDB } from '../models/models';
import { PicsaDbService, generateDBMeta } from '@picsa/shared/services/core/db';

@Injectable({
  providedIn: 'root',
})
export class FormStore {
  @observable forms: IFormDB[];
  @observable activeForm: IFormDB;
  @action setActiveForm(form: IFormDB) {
    this.activeForm = form;
    console.log('active form', this.activeForm);
  }
  // when active form id set, check if already loaded, if not find it
  @action async setActiveFormByKey(key: string) {
    console.log('setting active form by key');
    if (!this.forms) {
      await this.init();
    }
    if (!this.activeForm || this.activeForm._key !== key) {
      this.activeForm = this._getFormByKey(key);
      console.log('activeform', toJS(this.activeForm));
    }
    return this.activeForm;
  }

  constructor(private db: PicsaDbService) {
    this.init();
  }
  async init() {
    this.forms = await this.db.getCollection('forms');
    // *** TODO - add form filter depending on user type
  }

  // when user submits a form two version are saved, one to user profile and one to firebase collection
  // if no user id (never has authenticated) then user info may be retrieved at a future date through the response key

  public submitForm(response: IFormResponse) {
    // add to user forms
    this.saveFormResponse(this.activeForm._key, response);
    // add to firebase forms
    this.db.setDoc(`forms/${this.activeForm._key}/submissions` as any, {
      ...generateDBMeta(),
      ...response,
    });
    setTimeout(() => {
      // this.modalCtrl.dismiss();
    }, 1500);
  }

  private _getFormByKey(key: string) {
    return this.forms.find((form) => form._key === key);
  }

  private saveFormResponse(formID: string, response: IFormResponse) {
    // const user = this.user;
    // if (!user.submittedForms) {
    //   user.submittedForms = {};
    // }
    // if (!user.submittedForms[formID]) {
    //   user.submittedForms[formID] = {};
    // }
    // user.submittedForms[formID][response._key] = response;
    // this.actions.updateUser(user);
  }
}
