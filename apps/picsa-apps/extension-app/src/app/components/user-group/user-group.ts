import { Component, Input, OnDestroy } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Subject } from 'rxjs';

import { IUser, IUserGroup } from '../../models/models';
import { UserStore } from '../../store/user.store';

@Component({
  selector: 'user-group',
  templateUrl: 'user-group.html',
})
export class UserGroupComponent implements OnDestroy {
  private componentDestroyed: Subject<any> = new Subject();
  @Input() group: IUserGroup;
  user: IUser;
  joined: boolean;

  constructor(private alertCtrl: AlertController, private userStore: UserStore) {}

  ngOnDestroy() {
    this.componentDestroyed.next(true);
    this.componentDestroyed.unsubscribe();
  }

  userUpdate(user: IUser) {
    // set joined status
    this.joined = user && user.groups && user.groups.includes(this.group._key) ? true : false;
    console.log('user updated', user);
    this.user = user;
  }

  joinGroup() {
    if (!this.user.groups) {
      this.user.groups = [];
    }
    if (!this.user.groups.includes(this.group._key)) {
      this.user.groups.push(this.group._key);
    }
    this.user.authenticated = true;
    this.userStore.updateUser(this.user);
    // set user as authenticated if not
    // add group to joined groups
    // apply any settings (country, language, available pages etc.)
    // join notifications channels
  }

  async joinGroupClicked() {
    console.log('joining group', this.group);
    const alert = await this.alertCtrl.create({
      header: `Join ${this.group.name}`,
      inputs: [
        {
          name: 'key',
          placeholder: 'Access Key',
          type: 'password',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
            return;
          },
        },
        {
          text: 'Join',
          handler: (data) => {
            console.log('data', data);
            if (data.key == this.group.accessKey) {
              // logged in!
              return this.joinGroup();
            } else {
              // *** TODO - invalid login
              // alert.data.message = `<div class="invalid-key">Invalid access key</div>`;
              return false;
            }
          },
        },
      ],
    });
    await alert.present();
  }
}
