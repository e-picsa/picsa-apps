import { AfterViewInit, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { ENVIRONMENT } from '@picsa/environments/src';
import { SupabaseAuthService } from '@picsa/shared/services/core/supabase/services/supabase-auth.service';

import { SupabaseSignInDialogComponent } from '../sign-in-dialog/sign-in-dialog.component';

@Component({
  selector: 'dashboard-profile-menu',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, RouterModule],
  templateUrl: './profile-menu.component.html',
  styleUrls: ['./profile-menu.component.scss'],
})
export class ProfileMenuComponent implements AfterViewInit {
  constructor(public supabaseAuthService: SupabaseAuthService, private dialog: MatDialog) {}

  async ngAfterViewInit() {
    await this.supabaseAuthService.ready();
    // HACK - use anonymous user when running in dev
    if (!ENVIRONMENT.production) {
      await this.supabaseAuthService.signInDefaultUser();
    }
  }
  public signOut() {
    console.log('signing out');
  }
  public promptSignIn() {
    this.dialog.open(SupabaseSignInDialogComponent);
  }
}
