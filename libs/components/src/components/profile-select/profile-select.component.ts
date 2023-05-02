import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ANIMATION_DELAYED, FadeInOut } from '@picsa/shared/animations';
import { PicsaDialogService } from '@picsa/shared/features';
import { generateID } from '@picsa/shared/services/core/db/db.service';
import { hashmapToArray } from '@picsa/utils';

interface IUserProfile {
  _id: string;
  color: string;
  initials: string;
  name: string;
  role: 'extension' | 'farmer';
}

const STORAGE_NAME = 'picsa_profiles';

const PROFILE_FORM_BASE: { [key in keyof IUserProfile]: FormControl } = {
  _id: new FormControl('', Validators.required),
  color: new FormControl('', Validators.required),
  initials: new FormControl(''),
  name: new FormControl('', [Validators.required, Validators.minLength(2)]),
  role: new FormControl('extension', Validators.required),
};

@Component({
  selector: 'picsa-profile-select',
  templateUrl: './profile-select.component.html',
  styleUrls: ['./profile-select.component.scss'],
  animations: [FadeInOut(ANIMATION_DELAYED)],
})
export class ProfileSelectComponent {
  public activeProfile?: IUserProfile;
  public contentView: 'list' | 'create' | 'edit' = 'list';
  public profileForm: FormGroup<typeof PROFILE_FORM_BASE>;

  private activeProfileId = '';
  private profileHashmap: Record<string, IUserProfile> = {};

  constructor(public dialog: MatDialog, private picsaDialog: PicsaDialogService, fb: FormBuilder) {
    this.loadStorageProfiles();
    this.profileForm = fb.group(PROFILE_FORM_BASE);
    this.resetForm();
  }

  public get profileArray() {
    return hashmapToArray(this.profileHashmap, '_id');
  }

  public close() {
    this.dialog.closeAll();
    this.resetForm();
    this.contentView = 'list';
  }

  public setContentView(view: typeof this.contentView) {
    this.contentView = view;
  }

  public saveProfile() {
    const profile = this.profileForm.value as IUserProfile;
    const { _id } = profile;
    this.profileHashmap[_id] = profile;
    this.saveStorageProfiles();
    this.loadProfile(_id, true);
  }

  public editProfile(_id: string) {
    this.loadProfile(_id);
    if (this.activeProfile) {
      this.profileForm.patchValue(this.activeProfile);
    }
    this.contentView = 'create';
  }

  public loadProfile(_id: string, closeDialog = false) {
    // avoid loading if undefined
    if (typeof _id === 'string') {
      this.activeProfileId = _id;
      this.activeProfile = this.profileHashmap[_id];
      this.saveStorageProfiles();
      if (closeDialog) {
        // provide small delay for any button click animations
        setTimeout(() => {
          this.close();
        }, 250);
      }
    }
  }
  public async deleteProfile(_id: string) {
    const ref = await this.picsaDialog.open('delete', {});
    ref.afterClosed().subscribe((shouldDelete) => {
      if (shouldDelete) {
        if (_id in this.profileHashmap) {
          delete this.profileHashmap[_id];
        }
        this.loadProfile('');
        this.resetForm();
        this.contentView = 'list';
      }
    });
  }

  public setInitials() {
    const { name } = this.profileForm.value;
    this.profileForm.patchValue({ initials: this.nameToInitials(name) });
  }

  private loadStorageProfiles() {
    const storageProfiles = localStorage.getItem(STORAGE_NAME);
    if (storageProfiles) {
      // TODO - ensure storage profiles map onto default in case of future breaking changes
      const { activeProfileId, profiles } = JSON.parse(storageProfiles);
      this.profileHashmap = profiles;
      this.loadProfile(activeProfileId);
    }
  }

  private saveStorageProfiles() {
    localStorage.setItem(
      STORAGE_NAME,
      JSON.stringify({ activeProfileId: this.activeProfileId, profiles: this.profileHashmap })
    );
  }

  private resetForm() {
    this.profileForm.reset();
    // Pick a new default colour
    this.profileForm.patchValue({ _id: generateID(4), color: generateAvatarColor() });
  }

  /**
   * Convert full name to initials, using first to characters if first name only
   * or first and last name initials if multiple names provided
   */
  private nameToInitials(name: string = '') {
    // Default to using first 2 characters of name
    const initials = [name.charAt(0), name.charAt(1)];
    const names = name.split(' ');
    // If multiple names provides use last name for 2nd character
    if (names.length > 1) {
      initials[1] = names.pop()?.charAt(0) || '';
    }
    return initials.map((s) => s.toUpperCase()).join('');
  }
}

/** Pick a random colour avoiding yellow-ish part of spectrum */
function generateAvatarColor() {
  return hslToHex(randomNumberBetween(200, 400), 80, 70);
}

function hslToHex(h: number, s: number, l: number) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0'); // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function randomNumberBetween(start = 0, end = 0) {
  const range = end - start;
  const n = Math.round(Math.random() * range);
  return start + n;
}
