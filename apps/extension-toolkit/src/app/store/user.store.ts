import { Injectable } from '@angular/core';
import { observable, action, computed } from 'mobx-angular';
import { IUser } from '../models/models';
import { PicsaDbService, generateDBMeta } from '@picsa/services/core';
import { PicsaFileService } from '@picsa/services/native/file-service';
import { ENVIRONMENT } from '@picsa/environments';
import { LanguageCode } from '@picsa/models';

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
    private fileService: PicsaFileService
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
        await this.createNewUser();
        return this.loadUser();
      }
    }
    console.log('user', user);
    this.setUser(user);
  }

  async createNewUser() {
    const meta = generateDBMeta();
    const user: IUser = {
      lang: ENVIRONMENT.region.languages[0].code,
      ...meta
    };
    // update meta
    await this.db.setDoc('_appMeta', { ...user, _key: 'CURRENT_USER' });
    this.syncUser(user);
  }

  async syncUser(user: IUser) {
    await this.db.setDoc('_appMeta', { ...user, _key: 'CURRENT_USER' });
    return this.db.setDoc('users/${GROUP}/users', user, true);
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

  changeLanguage(code: string) {
    // TODO
    console.log('TODO - change language');
    // this.translate.use(code);
  }
  private _getLanguage(code: LanguageCode) {
    const lang = ENVIRONMENT.region.languages.find(l => l.code === code);
    return lang ? lang : {};
  }

  joinGroup() {
    // TODO
  }
}
