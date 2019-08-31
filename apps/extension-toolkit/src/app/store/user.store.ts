import { Injectable } from '@angular/core';
import { observable, action, computed } from 'mobx-angular';
import { IUser } from '../models/models';
import { PicsaDbService, generateDBMeta } from '@picsa/services/core/db';
import { PicsaFileService } from '@picsa/services/native/file-service';
import { ENVIRONMENT } from '@picsa/environments';
import { LanguageCode } from '@picsa/models';
import { PicsaTranslateService } from '@picsa/modules/translate';
import { toJS } from 'mobx';

@Injectable({
  providedIn: 'root'
})
export class UserStore {
  @observable user: IUser;
  @action
  setUser(user: IUser) {
    this.user = user;
  }
  @action
  updateUser(patch: Partial<IUser>) {
    this.user = { ...this.user, ...patch };
    this.syncUser(this.user);
  }
  @computed get language() {
    return this.user ? this._getLanguage(this.user.lang) : {};
  }

  constructor(
    private db: PicsaDbService,
    private fileService: PicsaFileService,
    private translate: PicsaTranslateService
  ) {
    this.loadUser();
  }

  async loadUser() {
    // TODO - generate user id and save to /user/userID - use to allow user syncing
    let user: IUser = await this.db.getDoc('_appMeta', 'CURRENT_USER');
    if (!user) {
      // no user, see if a backup exists on file if using mobile
      user = await this._loadUserBackup();
      if (!user) {
        user = await this.createNewUser();
      }
    }
    // in case user has been pulled form appMeta replace key
    user._key = user.id;
    console.log('user', user);
    this.setUser(user);
    this.setLanguage(user.lang);
  }

  async createNewUser() {
    const meta = generateDBMeta();
    const user: IUser = {
      lang: ENVIRONMENT.region.languages[0].code,
      // keep id as well as key so can persist within appMeta in different key
      id: meta._key,
      ...meta
    };
    // update meta
    await this.db.setDoc('_appMeta', { ...user, _key: 'CURRENT_USER' });
    return user;
  }

  async syncUser(user: IUser) {
    console.log('syncing user', toJS(user));
    await this.db.setDoc('_appMeta', { ...user, _key: 'CURRENT_USER' });
    console.log('user updated locally');
    // return this.db.setDoc('users/${GROUP}/users', user, true);
  }

  private async _backupUserToDisk() {
    await this.fileService.createFile(
      'picsaUserBackup.txt',
      this.user,
      true,
      true
    );
    return;
  }

  private async _loadUserBackup() {
    const fileTxt = await this.fileService.readTextFile(
      'picsaUserBackup.txt',
      true
    );
    if (fileTxt) {
      const user: IUser = JSON.parse(fileTxt);
      return user;
    }
    return null;
  }

  setLanguage(code: LanguageCode) {
    this.translate.setLang(code);
  }

  private _getLanguage(code: LanguageCode) {
    const lang = ENVIRONMENT.region.languages.find(l => l.code === code);
    return lang ? lang : {};
  }

  joinGroup() {
    // TODO
  }
}
