import { Component, TemplateRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ANIMATION_DELAYED, FadeInOut } from '@picsa/shared/animations';

interface IUserProfile {
  name: string;
  initials: string;
  color: string;
  role: 'extension' | 'farmer';
}

const PROFILE_FORM: { [key in keyof IUserProfile]: FormControl } = {
  // Create a random hsl colour avoiding more yellow-ish tones
  color: new FormControl(generateAvatarColor()),
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
  activeProfile?: IUserProfile;
  profiles: IUserProfile[] = [];
  contentView: 'list' | 'create' = 'list';

  profileForm: FormGroup<typeof PROFILE_FORM>;

  constructor(public dialog: MatDialog, private fb: FormBuilder) {
    this.profileForm = fb.group(PROFILE_FORM);
  }

  public setContentView(view: typeof this.contentView) {
    this.contentView = view;
  }
  public editProfile() {
    // TODO - edit active profile
  }
  public saveProfile() {
    // TODO - save to local storage
    console.log('saving profile', this.profileForm.value);
    const profile = this.profileForm.value as IUserProfile;
    this.activeProfile = profile;
    this.profiles.push(profile);
    this.profileForm.reset();
    // Pick a new default colour
    this.profileForm.patchValue({ color: generateAvatarColor() });
    this.contentView = 'list';
  }
  public loadProfile() {
    // TODO - load from local storage
    // Should also ensure it maps onto default profile in case of future breaking changes
  }

  public setInitials() {
    const { name } = this.profileForm.value;
    this.profileForm.patchValue({ initials: this.nameToInitials(name) });
  }

  /**
   * Convert full name to initials, using first to characters if first name only
   * or first and last name initials if multiple names provided
   */
  private nameToInitials(name: string = '') {
    // Default to using first 2 characters of name
    let initials = [name.charAt(0), name.charAt(1)];
    const names = name.split(' ');
    // If multiple names provides use last name for 2nd character
    if (names.length > 1) {
      initials[1] = names.pop()!.charAt(0);
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
