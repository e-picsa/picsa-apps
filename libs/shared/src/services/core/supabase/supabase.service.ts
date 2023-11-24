import { Injectable, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ENVIRONMENT } from '@picsa/environments/src';
import { StorageClient } from '@supabase/storage-js';
import { AuthError, createClient, RealtimeClient, SupabaseClient, User } from '@supabase/supabase-js';
import { SupabaseAuthClient } from '@supabase/supabase-js/dist/module/lib/SupabaseAuthClient';

import { PicsaAsyncService } from '../../asyncService.service';
import { PicsaNotificationService } from '../notification.service';
import { SupabaseSignInDialogComponent } from './dialogs/sign-in.dialog';

/** Key safe to use in browser (assuming tables have row-level security) */

@Injectable({ providedIn: 'root' })
export class SupabaseService extends PicsaAsyncService {
  /** Authenticated user */
  public authUser = signal<User | undefined>(undefined);

  /** Access to postgres db as a shortcut to table from method */
  public db: { table: SupabaseClient['from'] };

  private supabase: SupabaseClient;
  private storage: StorageClient;
  private realtime: RealtimeClient;

  private auth: SupabaseAuthClient;

  constructor(private notificationService: PicsaNotificationService, private dialog: MatDialog) {
    super();
    const { anonKey, apiUrl } = ENVIRONMENT.supabase;
    this.supabase = createClient(apiUrl, anonKey, {});
    this.storage = this.supabase.storage;
    this.realtime = this.supabase.realtime;
    this.auth = this.supabase.auth;
    this.db = { table: (relation: string) => this.supabase.from(relation) };
  }
  public override async init(...args: any): Promise<void> {
    this.subscribeToAuthChanges();
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

  /** User shared credential to sign in as an anonymous user for supabase */
  private async signInAnonymousUser() {
    const { email, password } = ENVIRONMENT.supabase.appUser;
    const { error } = await this.supabase.auth.signInWithPassword({ email, password: password || email });
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

  /** Create variants of error messages received in supabase for notification purposes */
  private getUserErrorMessage(error: AuthError): { message: string; matIcon: string; devMessage?: string } {
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

  private logUserErrorMessage(error: AuthError) {
    const { message, matIcon, devMessage } = this.getUserErrorMessage(error);
    this.notificationService.showUserNotification({ matIcon, message });
    if (devMessage) {
      console.error('[Developer Note]\n' + devMessage);
    }
  }
}
