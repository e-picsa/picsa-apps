import { Component, TemplateRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ANIMATION_DELAYED, FadeInOut } from '@picsa/shared/animations';

interface IUserProfile {
  name: string;
  initials: string;
  color: string;
  icon: string;
  role: 'extension' | 'farmer';
}

const PROFILE_FORM: { [key in keyof IUserProfile]: FormControl } = {
  color: new FormControl('#0000ff'),
  icon: new FormControl(''),
  initials: new FormControl(''),
  name: new FormControl('', Validators.minLength(2)),
  role: new FormControl('farmer', Validators.required),
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
  public saveProfile() {
    console.log('saving profile', this.profileForm);
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
