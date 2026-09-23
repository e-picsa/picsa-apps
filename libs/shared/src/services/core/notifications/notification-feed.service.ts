import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import type {
  INotificationAction,
  INotificationChannel,
  INotificationCreateInput,
  INotificationEntry,
  INotificationPreferences,
} from '@picsa/models';
import type { RxCollection, RxDocument } from 'rxdb';
import { filter, map, Subject, takeUntil } from 'rxjs';

import { PicsaAsyncService } from '../../asyncService.service';
import { PicsaDatabase_V2_Service } from '../db_v2';
import { NOTIFICATION_PREFERENCES_SCHEMA, NOTIFICATIONS_SCHEMA } from '../db_v2/schemas/notifications';

export const PREFERENCES_DOC_ID = 'user_preferences';
export const ONBOARDING_NOTIFICATION_ID = 'onboarding-notification-preferences';

export const DEFAULT_NOTIFICATION_PREFERENCES: Record<INotificationChannel, boolean> = {
  weather_forecasts: true,
  agronomic_advisories: true,
  app_updates: true,
  general_announcements: true,
};

type ActionHandler = (action: INotificationAction, entry: INotificationEntry) => void | Promise<void>;

@Injectable({
  providedIn: 'root',
})
export class PicsaNotificationFeedService extends PicsaAsyncService implements OnDestroy {
  private dbService = inject(PicsaDatabase_V2_Service);
  private router = inject(Router);

  private notifsCollection!: RxCollection<INotificationEntry>;
  private prefsCollection!: RxCollection<INotificationPreferences>;
  private destroyed$ = new Subject<void>();

  private actionHandlers = new Map<string, ActionHandler>();

  /** All active, non-deleted notifications ordered by priority then creation time */
  public notifications = signal<INotificationEntry[]>([]);

  /** User channel preferences */
  public preferences = signal<INotificationPreferences>({
    id: PREFERENCES_DOC_ID,
    channels: { ...DEFAULT_NOTIFICATION_PREFERENCES },
    updatedAt: new Date().toISOString(),
  });

  /** Active notifications filtered by user's enabled channels */
  public activeNotifications = computed(() => {
    const prefs = this.preferences();
    const all = this.notifications();
    return all.filter((n) => prefs.channels[n.channel] !== false);
  });

  /** Count of unread active notifications */
  public unreadCount = computed(() => {
    return this.activeNotifications().filter((n) => !n.readAt).length;
  });

  public override async init(): Promise<void> {
    await this.dbService.ready();

    await this.dbService.ensureCollections({
      notifications: {
        schema: NOTIFICATIONS_SCHEMA,
      },
      notification_preferences: {
        schema: NOTIFICATION_PREFERENCES_SCHEMA,
      },
    });

    this.notifsCollection = this.dbService.db.collections.notifications;
    this.prefsCollection = this.dbService.db.collections.notification_preferences;

    await this.initPreferences();
    await this.initSeedNotifications();

    this.subscribeToDataStreams();
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  /**
   * Register a custom action handler for action payloads that use `actionKey`.
   */
  public registerActionHandler(actionKey: string, handler: ActionHandler): void {
    this.actionHandlers.set(actionKey, handler);
  }

  /**
   * Internal helper to upsert document without calling this.ready() to avoid init deadlock.
   */
  private async upsertNotificationDoc(input: INotificationCreateInput): Promise<RxDocument<INotificationEntry>> {
    const existing = await this.notifsCollection.findOne({ selector: { id: input.id } }).exec();
    if (existing) {
      return existing.patch({
        title: input.title,
        body: input.body,
        channel: input.channel,
        priority: input.priority,
        actionPayload: input.actionPayload,
        secondaryActionPayload: input.secondaryActionPayload,
        isSticky: input.isSticky ?? existing.get('isSticky') ?? false,
      });
    }

    const doc: INotificationEntry = {
      id: input.id,
      title: input.title,
      body: input.body,
      channel: input.channel,
      priority: input.priority,
      createdAt: input.createdAt ?? new Date().toISOString(),
      readAt: null,
      deletedAt: null,
      isSticky: input.isSticky ?? false,
      actionPayload: input.actionPayload,
      secondaryActionPayload: input.secondaryActionPayload,
    };
    return this.notifsCollection.insert(doc);
  }

  /**
   * Register / post a notification to the feed bus.
   * If a notification with the same ID already exists, it is updated.
   */
  public async registerNotification(input: INotificationCreateInput): Promise<RxDocument<INotificationEntry>> {
    await this.ready();
    return this.upsertNotificationDoc(input);
  }

  /**
   * Soft-delete or unregister a notification by ID.
   */
  public async unregisterNotification(id: string): Promise<boolean> {
    await this.ready();
    const doc = await this.notifsCollection.findOne({ selector: { id } }).exec();
    if (!doc) return false;
    await doc.patch({ deletedAt: new Date().toISOString() });
    return true;
  }

  /**
   * Mark a specific notification as read.
   */
  public async markAsRead(id: string): Promise<void> {
    await this.ready();
    const doc = await this.notifsCollection.findOne({ selector: { id } }).exec();
    if (doc && !doc.get('readAt')) {
      await doc.patch({ readAt: new Date().toISOString() });
    }
  }

  /**
   * Mark all active notifications as read.
   */
  public async markAllAsRead(): Promise<void> {
    await this.ready();
    const unread = await this.notifsCollection
      .find({
        selector: {
          readAt: null,
          deletedAt: null,
        },
      })
      .exec();

    const timestamp = new Date().toISOString();
    await Promise.all(unread.map((doc) => doc.patch({ readAt: timestamp })));
  }

  /**
   * Dismiss a notification from the feed.
   * Sticky notifications cannot be dismissed.
   */
  public async dismissNotification(id: string): Promise<boolean> {
    await this.ready();
    const doc = await this.notifsCollection.findOne({ selector: { id } }).exec();
    if (!doc) return false;

    // Sticky notifications cannot be dismissed by user
    if (doc.get('isSticky')) {
      return false;
    }

    await doc.patch({ deletedAt: new Date().toISOString() });
    return true;
  }

  /**
   * Update preference for a single notification channel.
   */
  public async updateChannelPreference(channel: INotificationChannel, enabled: boolean): Promise<void> {
    await this.ready();
    const current = this.preferences();
    const updatedChannels = {
      ...current.channels,
      [channel]: enabled,
    };
    const doc = await this.prefsCollection.findOne({ selector: { id: PREFERENCES_DOC_ID } }).exec();
    const updatedAt = new Date().toISOString();
    if (doc) {
      await doc.patch({ channels: updatedChannels, updatedAt });
    } else {
      await this.prefsCollection.insert({
        id: PREFERENCES_DOC_ID,
        channels: updatedChannels,
        updatedAt,
      });
    }
  }

  /**
   * Execute primary or secondary action on an entry.
   */
  public async executeAction(notification: INotificationEntry, type: 'primary' | 'secondary'): Promise<void> {
    const action = type === 'primary' ? notification.actionPayload : notification.secondaryActionPayload;
    if (!action) return;

    // Automatically mark notification as read when user clicks its action
    await this.markAsRead(notification.id);

    if (action.actionKey) {
      const handler = this.actionHandlers.get(action.actionKey);
      if (handler) {
        await handler(action, notification);
        return;
      }
    }

    if (action.route) {
      await this.router.navigateByUrl(action.route);
      return;
    }
  }

  /**
   * Initialize preferences document in RxDB if not already created.
   */
  private async initPreferences(): Promise<void> {
    const doc = await this.prefsCollection.findOne({ selector: { id: PREFERENCES_DOC_ID } }).exec();
    if (!doc) {
      await this.prefsCollection.insert({
        id: PREFERENCES_DOC_ID,
        channels: { ...DEFAULT_NOTIFICATION_PREFERENCES },
        updatedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Ensure the first onboarding sticky notification is registered.
   */
  private async initSeedNotifications(): Promise<void> {
    const onboardingDoc = await this.notifsCollection.findOne({ selector: { id: ONBOARDING_NOTIFICATION_ID } }).exec();

    if (!onboardingDoc) {
      await this.upsertNotificationDoc({
        id: ONBOARDING_NOTIFICATION_ID,
        title: 'Set your notification preferences',
        body: 'Customise the alerts and advisories you receive, such as weather forecasts, crop advisories, and system notices.',
        channel: 'app_updates',
        priority: 'high',
        isSticky: true,
        actionPayload: {
          label: 'Configure Preferences',
          route: '/notifications/preferences',
        },
      });
    }
  }

  /**
   * Subscribe to RxDB reactive queries and pipe changes into Angular signals.
   */
  private subscribeToDataStreams(): void {
    // 1. Notifications stream
    this.notifsCollection
      .find({
        selector: {
          deletedAt: null,
        },
      })
      .$?.pipe(
        takeUntil(this.destroyed$),
        filter((docs): docs is RxDocument<INotificationEntry>[] => Boolean(docs)),
        map((docs) => docs.map((d) => (typeof d.toJSON === 'function' ? d.toJSON() : (d as any)))),
      )
      .subscribe((items) => {
        // Sort: Sticky first, high priority next, newest first
        const sorted = items.sort((a, b) => {
          if (a.isSticky !== b.isSticky) return a.isSticky ? -1 : 1;
          const priorityScore = (p: string) => (p === 'high' ? 3 : p === 'medium' ? 2 : 1);
          const scoreDiff = priorityScore(b.priority) - priorityScore(a.priority);
          if (scoreDiff !== 0) return scoreDiff;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        this.notifications.set(sorted);
      });

    // 2. Preferences stream
    this.prefsCollection
      .findOne({
        selector: {
          id: PREFERENCES_DOC_ID,
        },
      })
      .$?.pipe(
        takeUntil(this.destroyed$),
        filter((doc): doc is RxDocument<INotificationPreferences> => Boolean(doc)),
        map((d) => (typeof d.toJSON === 'function' ? d.toJSON() : (d as any))),
      )
      .subscribe((prefs) => {
        if (prefs) {
          this.preferences.set(prefs);
        }
      });
  }

  /**
   * Helper utility for developers to seed sample notifications into the local feed.
   */
  public async seedDevSamples(): Promise<void> {
    await this.registerNotification({
      id: `dev-weather-${Date.now()}`,
      title: 'Seasonal Forecast Advisory',
      body: 'Above-normal rainfall is predicted for your district over the next fortnight. Review your planting window and fertilizer management.',
      channel: 'weather_forecasts',
      priority: 'high',
      createdAt: new Date().toISOString(),
      actionPayload: {
        label: 'View Climate Forecast',
        route: '/forecasts',
      },
    });

    await this.registerNotification({
      id: `dev-agronomy-${Date.now()}`,
      title: 'Maize Planting Window Open',
      body: 'Soil moisture levels are optimal for planting early-maturing varieties. Check crop probability curves before proceeding.',
      channel: 'agronomic_advisories',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      actionPayload: {
        label: 'Crop Probability Tool',
        route: '/crop-probability',
      },
    });

    await this.registerNotification({
      id: `dev-general-${Date.now()}`,
      title: 'Local Agricultural Extension Workshop',
      body: 'Community training on sustainable water harvesting takes place this Thursday at 10:00 AM at the extension centre.',
      channel: 'general_announcements',
      priority: 'low',
      createdAt: new Date().toISOString(),
    });
  }
}
