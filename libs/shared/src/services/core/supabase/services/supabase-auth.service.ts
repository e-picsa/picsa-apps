import { Injectable, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ENVIRONMENT } from '@picsa/environments';
import { AuthError, SupabaseClient, User } from '@supabase/supabase-js';

import { PicsaAsyncService } from '../../../asyncService.service';
import { PicsaNotificationService } from '../../notification.service';
import { SupabaseSignInDialogComponent } from '../dialogs/sign-in.dialog';

@Injectable({ providedIn: 'root' })
export class SupabaseAuthService extends PicsaAsyncService {
  /** Authenticated user */
  public authUser = signal<User | undefined>(undefined);

  private supabaseClient: SupabaseClient;

  private get auth() {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not registered in auth');
    }
    return this.supabaseClient.auth;
  }

  constructor(private dialog: MatDialog, private notificationService: PicsaNotificationService) {
    super();
  }

  public override async init(): Promise<void> {
    this.subscribeToAuthChanges();
  }

  public registerSupabaseClient(client: SupabaseClient) {
    this.supabaseClient = client;
  }

  public async signInPrompt() {
    this.dialog.open(SupabaseSignInDialogComponent, { data: { service: this } });
  }

  public async signInUser(email: string, password: string) {
    return this.auth.signInWithPassword({ email, password });
  }

  public async signUpUser(email: string, password: string) {
    return this.auth.signUp({ email, password });
  }

  public async signOut() {
    return this.auth.signOut();
  }

  /** Attempt to sign-in as persisted user, with fallback to anonymous */
  public async signInDefaultUser() {
    const { error } = await this.auth.getUser();
    if (error) {
      console.log('User session not found, signing in anonymous user');
      return this.signInAnonymousUser();
    }
    // return user as updated by auth change subscriber
    return this.authUser;
  }

  /** Create variants of error messages received in supabase for notification purposes */
  public getUserErrorMessage(error: AuthError): { message: string; matIcon: string; devMessage?: string } {
    const { name, message } = error;
    const mapping = {
      AuthRetryableFetchError: {
        message: 'Server connection Failed',
        matIcon: 'cloud_off',
        devMessage: 'Ensure the server is running locally',
      },
      'Invalid login credentials': {
        message: 'User does not exist or password incorrect',
        matIcon: 'person_alert',
      },
      'invalid claim: missing sub claim': {
        message: 'No user signed in, unable to load',
      },
    };
    return mapping[message] || { message: `${name} - ${message}`, matIcon: 'error' };
  }

  public logUserErrorMessage(error: AuthError) {
    const { message, matIcon, devMessage } = this.getUserErrorMessage(error);
    this.notificationService.showUserNotification({ matIcon, message });
    if (devMessage) {
      console.error('[Developer Note]\n' + devMessage);
    }
  }

  /** User shared credential to sign in as an anonymous user for supabase */
  private async signInAnonymousUser() {
    const { email, password } = ENVIRONMENT.supabase.appUser;
    const { error } = await this.auth.signInWithPassword({ email, password: password || email });
    // TODO - could consider function to generate app user base on id which could also use RLS for sync
    if (error) {
      console.error(error);
      this.logUserErrorMessage(error);
      if (error.message === 'Invalid login credentials') {
        const devMessage = `Ensure user with email: [${email}] created in supabase auth.\nSee guidance in server Readme`;
        console.error('[Developer Note]\n' + devMessage);
      }
    }
    // return user as updated by auth change subscriber
    return this.authUser;
  }

  private subscribeToAuthChanges() {
    this.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (user?.id !== this.authUser()?.id) {
        this.authUser.set(session?.user);
      }
    });
  }
}
