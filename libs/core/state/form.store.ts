// Whilst project has angular-redux throughout, also planning migration to mobx with initial modules

import { observable, action } from 'mobx-angular';
import { toJS } from 'mobx';
import { Injectable } from '@angular/core';
import { IForm, IFormResponse } from '../models';
import { DataStore } from './data.store';
import { StorageProvider, UserProvider, DBService } from '../services';

@Injectable({
  providedIn: 'root'
})
export class FormStore extends DataStore {
  @observable forms: IForm[];
  @observable activeForm: IForm;
  @action setActiveForm(form: IForm) {
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

  constructor(
    storagePrvdr: StorageProvider,
    private userPrvdr: UserProvider,
    private db: DBService
  ) {
    super(storagePrvdr);
    this.init();
  }
  async init() {
    this.forms = await this.getStoredData('forms');
    // *** TODO - add form filter depending on user type
  }

  // when user submits a form two version are saved, one to user profile and one to firebase collection
  // if no user id (never has authenticated) then user info may be retrieved at a future date through the response key

  public submitForm(response: IFormResponse) {
    // add to user forms
    this.userPrvdr.saveFormResponse(this.activeForm._key, response);
    // add to firebase forms
    this.db.addToCollection(
      `forms/${this.activeForm._key}/submissions`,
      response,
      response._key
    );
    setTimeout(() => {
      // this.modalCtrl.dismiss();
    }, 1500);
  }

  private _getFormByKey(key: string) {
    return this.forms.find(form => form._key === key);
  }
}
