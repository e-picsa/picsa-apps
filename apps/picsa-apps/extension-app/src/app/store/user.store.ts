import { Injectable } from '@angular/core';
import { observable, action, computed } from 'mobx-angular';
import { IUser } from '../models/models';
import { PicsaDbService, generateDBMeta } from '@picsa/shared/services/core/db';
import { PicsaFileService } from '@picsa/shared/services/native/file-service';
import { ENVIRONMENT } from '@picsa/environments';
import { IRegionLang, LanguageCode } from '@picsa/models';
import { toJS } from 'mobx';

@Injectable({
  providedIn: 'root',
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

  constructor(
    private db: PicsaDbService,
    private fileService: PicsaFileService
  ) {
    this.loadUser();
  }

  // TODO - deprecate(???)
  async loadUser() {
    // TODO - generate user id and save to /user/userID - use to allow user syncing
    let user: IUser = await this.db.getDoc('_appMeta', 'CURRENT_USER');
    if (!user) {
      // no user, see if a backup exists on file if using mobile
      user = (await this._loadUserBackup()) as any;
      if (!user) {
        user = await this.createNewUser();
      }
    }
    // in case user has been pulled form appMeta replace key
    user._key = user.id;
    console.log('user', user);
    this.setUser(user);
  }

  async createNewUser() {
    const meta = generateDBMeta();
    const user: IUser = {
      // keep id as well as key so can persist within appMeta in different key
      id: meta._key,
      ...meta,
    };
    // update meta
    await this.db.setDoc('_appMeta', { ...user, _key: 'CURRENT_USER' });
    return user;
  }

  async syncUser(user: IUser) {
    console.log('syncing user', toJS(user));
    await this.db.setDoc('_appMeta', { ...user, _key: 'CURRENT_USER' });
    // user sync happens on first load so ensure ready first
    await this.fileService.ready();
    await this._backupUserToDisk();
    console.log('user updated locally');
    // return this.db.setDoc('users/${GROUP}/users', user, true);
  }

  private async _backupUserToDisk() {
    await this.fileService.writeFile(
      'public',
      'picsa',
      `picsaUserBackup.txt`,
      toJS(this.user)
    );
    return;
  }

  private async _loadUserBackup() {
    const fileTxt = await this.fileService.readTextFile(
      `picsaUserBackup.txt`,
      true
    );
    if (fileTxt) {
      const user: IUser = JSON.parse(fileTxt);
      return user;
    }
    return null;
  }

  joinGroup() {
    // TODO
  }
}
