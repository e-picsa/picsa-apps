import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';
import type { Database } from '@picsa/server-types';
import { objectDiff } from '@picsa/utils/object.utils';
import { AuthError, SupabaseClient, User } from '@supabase/supabase-js';
import { jwtDecode, JwtPayload } from 'jwt-decode';

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
export class SupabaseAuthService {
  private document = inject<Document>(DOCUMENT);
  private notificationService = inject(PicsaNotificationService);
  private errorService = inject(ErrorHandlerService);

  /** Authenticated user */
  public authUser = signal<IAuthUser | undefined>(undefined, {
    equal: (a, b) => {
      // ignore changes to `updated_at` field, but diff any other changes
      const diff = objectDiff(a, b);
      return diff.updated_at && Object.keys(diff).length === 1;
    },
  });
  public authUserId = computed(() => this.authUser()?.id);

  /** Track if initial auth check has completed */
  public isAuthChecked = signal(!this.hasSupabaseAuthToken());

  private client: SupabaseClient;

  private get auth() {
    return this.client.auth;
  }

  /** As the auth service is a child of the main supabase service provide way to register parent client */
  public registerSupabaseClient(client: SupabaseClient) {
    this.client = client;
    this.subscribeToAuthChanges();
    // Explicitly check for session to handle edge cases where onAuthStateChange doesn't fire
    // Only verify if we have a token (to avoid unnecessary network requests on public pages)
    if (this.hasSupabaseAuthToken()) {
      this.client.auth.getSession().then(() => {
        this.isAuthChecked.set(true);
      });
    }
  }

  private hasSupabaseAuthToken(): boolean {
    // Check for any key that looks like a Supabase auth token
    // Typically: sb-<project-ref>-auth-token
    return Object.keys(localStorage).some((key) => key.startsWith('sb-') && key.endsWith('-auth-token'));
  }

  public async signInUser(email: string, password: string) {
    return this.auth.signInWithPassword({ email, password });
  }

  public async signUpUser(email: string, password: string, data?: object) {
    return this.auth.signUp({
      email,
      password,
      options: data ? { data } : undefined,
    });
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
    this.auth.signOut();
    // Clear anything persisted to storage
    localStorage.clear();
    sessionStorage.clear();
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
    console.log('subscribing to auth chagnes');
    // Subscribe to authenticated user changes
    this.auth.onAuthStateChange((_event, session) => {
      console.log(`[AUTH] ${_event}`);
      // Ensure we mark auth as checked on any event (including INITIAL_SESSION)
      this.isAuthChecked.set(true);

      const user = session?.user as IAuthUser;
      if (session) {
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
