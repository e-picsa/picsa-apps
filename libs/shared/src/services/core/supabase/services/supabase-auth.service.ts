import { Injectable, signal } from '@angular/core';
import { ENVIRONMENT } from '@picsa/environments';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Database } from '@picsa/server-types';
import { AuthError, SupabaseClient, User } from '@supabase/supabase-js';
import { SupabaseAuthClient } from '@supabase/supabase-js/dist/module/lib/SupabaseAuthClient';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { firstValueFrom, Subject } from 'rxjs';

import { PicsaAsyncService } from '../../../asyncService.service';
import { PicsaNotificationService } from '../../notification.service';

type IDeploymentAuthRoles = {
  [deployment_id: string]: IAuthRole[];
};
export type IAuthRole = Database['public']['Enums']['app_role'];

export type IAuthUser = User & { picsa_roles: IDeploymentAuthRoles };

interface ICustomAuthJWTPayload extends JwtPayload {
  picsa_roles: IDeploymentAuthRoles;
}

/**
 * Child service used to manage auth-specific operations from supabase
 * Requires parent service to initialise with main supabase client
 */
@Injectable({ providedIn: 'root' })
export class SupabaseAuthService extends PicsaAsyncService {
  /** Authenticated user */
  public authUser = signal<IAuthUser | undefined>(undefined);

  /** Track parent supabase client registration */
  private register$ = new Subject<SupabaseClient>();

  private auth: SupabaseAuthClient;

  private supabaseClient: SupabaseClient;

  constructor(private notificationService: PicsaNotificationService) {
    super();
  }

  public override async init(): Promise<void> {
    // wait for service to have supabase client registered (done when main client initialised)
    if (!this.auth) {
      await firstValueFrom(this.register$);
    }
    this.subscribeToAuthChanges();
  }

  /** As the auth service is a child of the main supabase service provide way to register parent client */
  public registerSupabaseClient(client: SupabaseClient) {
    this.supabaseClient = client;
    this.auth = client.auth;
    this.register$.next(client);
    this.register$.complete();
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
    // Subscribe to authenticated user changes
    this.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user as IAuthUser;
      if (session) {
        // ignore INITIAL_SESSION as also 'SIGNED_IN' event will be triggered
        if (_event === 'INITIAL_SESSION') return;
        const { picsa_roles } = jwtDecode(session.access_token) as ICustomAuthJWTPayload;
        user.picsa_roles = picsa_roles || {};
      }
      this.authUser.set(user);
    });
    // TODO - trigger auth token refresh on permissions change
  }
}
