import { DOCUMENT } from '@angular/common';
import { effect, Inject, Injectable, signal } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Database } from '@picsa/server-types';
import { objectDiff } from '@picsa/utils/object.utils';
import { AuthError, SupabaseClient, User } from '@supabase/supabase-js';
import { SupabaseAuthClient } from '@supabase/supabase-js/dist/module/lib/SupabaseAuthClient';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { firstValueFrom, Subject } from 'rxjs';

import { PicsaAsyncService } from '../../../asyncService.service';
import { ErrorHandlerService } from '../../error-handler.service';
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
  public authUser = signal<IAuthUser | undefined>(undefined, {
    equal: (a, b) => {
      // ignore changes to `updated_at` field, but diff any other changes
      const diff = objectDiff(a, b);
      return diff.updated_at && Object.keys(diff).length === 1;
    },
  });

  /** Track parent supabase client registration */
  private register$ = new Subject<SupabaseClient>();

  private auth: SupabaseAuthClient;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private notificationService: PicsaNotificationService,
    private errorService: ErrorHandlerService,
  ) {
    super();
    effect(() => {
      const user = this.authUser();
      // Log user for prod debugging
      if (user) {
        console.log(`[AUTH USER]`, user);
      }
    });
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

  public async resetEmailPassword(email: string) {
    const baseUrl = this.document.location.origin;
    const redirectToUrl = `${baseUrl}/profile/password-reset`;
    return this.auth.resetPasswordForEmail(email, {
      redirectTo: redirectToUrl,
    });
  }

  // this works automatically since the access token is saved in cookies (really cool)
  public async resetResetUserPassword(newPassword: string) {
    return this.auth.updateUser({ password: newPassword });
  }

  public async signOut() {
    return this.auth.signOut();
  }

  /**
   * Try to sign in existing session user, falling back to anonymous if failed
   *
   * NOTE - this will create new anonymous users on auth, so only should be used
   * in app when not providing alternative sign-in provider and requiring db access
   * */
  public async signInAppUserOrAnonymous() {
    const { data, error: getSessionError } = await this.auth.getSession();
    if (getSessionError) {
      this.errorService.handleError(getSessionError);
      return;
    }
    if (!data.session) {
      const { data, error: signInError } = await this.auth.signInAnonymously();
      if (signInError) {
        console.error('[SUPABASE AUTH] Failed to sign in anonymous user', signInError);
        this.errorService.handleError(signInError);
      }
      if (data.user) {
        console.log('[SUPABASE AUTH] Anonymous user created', data);
      }
    }
  }

  /** Attempt to sign-in as persisted user, with fallback to anonymous */
  public async signInDashboardDevUser() {
    const { error } = await this.auth.getUser();
    if (error) {
      return this.signInDevUser();
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

  /** Use generated dev credential when running supabase locally */
  private async signInDevUser() {
    const email = 'admin@picsa.app';
    const password = 'admin@picsa.app';
    const { error } = await this.auth.signInWithPassword({ email, password });
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
    this.auth.onAuthStateChange((_event, session) => {
      console.log(`[AUTH] ${_event}`);
      const user = session?.user as IAuthUser;
      if (session) {
        // ignore INITIAL_SESSION as also 'SIGNED_IN' event will be triggered
        if (_event === 'INITIAL_SESSION') return;
        const { picsa_roles } = jwtDecode(session.access_token) as ICustomAuthJWTPayload;
        user.picsa_roles = picsa_roles || {};

        // If user auth cames are updated it will trigger a signed_in action (same as initial)
        // Refresh session to ensure any updated user roles are included
        if (_event === 'SIGNED_IN') {
          this.auth.refreshSession();
        }
      }
      this.authUser.set(user);
    });
  }
}
