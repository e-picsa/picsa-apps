import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { IUser } from '../../models/models';
import { UserStore } from '../../store/user.store';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss']
})
export class SettingsPage {
  user: IUser;
  lastBackup: string;
  name: string;

  constructor(public alertCtrl: AlertController, private userStore: UserStore) {
    this.getLastBackup();
  }

  async getLastBackup() {
    // const backup: string = await this.storagePrvdr.get('_lastBackup');
    // this.lastBackup = backup;
  }

  async userEdit(field: string) {
    const prompt = await this.alertCtrl.create({
      header: `Set user ${field}`,
      inputs: [
        {
          name: 'val',
          placeholder: field,
          type: 'text'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {}
        },
        {
          text: 'Save',
          handler: data => {
            this.updateUser(field, data.val);
          }
        }
      ]
    });
    await prompt.present();
  }

  // }
  updateUser(key: string, val: any) {
    console.log(key, val);
    this.user[key] = val;
    this.userStore.updateUser(this.user);
  }
}
