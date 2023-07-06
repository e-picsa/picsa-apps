import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export const USER_ID_DEFAULT = '__default__';

export interface IPicsaUser {
  _id: string;
  color: string;
  initials: string;
  name: string;
  role: 'extension' | 'farmer';
}

const USER_DEFAULT: IPicsaUser = {
  _id: USER_ID_DEFAULT,
  role: 'extension',
  color: '',
  initials: '',
  name: '',
};

const STORAGE_NAME = 'picsa_users';

@Injectable({ providedIn: 'root' })
export class PicsaUserService {
  activeUser$ = new BehaviorSubject(USER_DEFAULT);

  public allUsersHashmap: Record<string, IPicsaUser> = {};

  constructor() {
    this.loadStorageUsers();
  }
  public setActiveUser(id: string) {
    const user = this.allUsersHashmap[id] || USER_DEFAULT;
    this.activeUser$.next(user);
    this.saveStorageUsers();
    console.log('[User]', this.activeUser$.value);
  }

  public deleteUser(_id: string) {
    if (_id in this.allUsersHashmap) {
      delete this.allUsersHashmap[_id];
      this.saveStorageUsers();
      this.setActiveUser('');
    }
  }

  public createOrUpdateUser(user: IPicsaUser) {
    // If no other users exist retain the default id to avoid losing existing content
    if (Object.keys(this.allUsersHashmap).length === 0) {
      user._id = USER_ID_DEFAULT;
    }
    const { _id } = user;
    this.allUsersHashmap[_id] = user;
    this.saveStorageUsers();
    this.setActiveUser(_id);
  }

  private loadStorageUsers() {
    const storageUsers = localStorage.getItem(STORAGE_NAME);
    if (storageUsers) {
      // TODO - ensure storage users map onto default in case of future breaking changes
      const { activeUserId, users } = JSON.parse(storageUsers);
      this.allUsersHashmap = users;
      this.setActiveUser(activeUserId);
    }
  }

  private saveStorageUsers() {
    const activeUserId = this.activeUser$.value._id;
    localStorage.setItem(STORAGE_NAME, JSON.stringify({ activeUserId, users: this.allUsersHashmap }));
  }
}
