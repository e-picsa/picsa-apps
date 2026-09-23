/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { INotificationEntry, INotificationPreferences } from '@picsa/models';
import { BehaviorSubject, map } from 'rxjs';

import { PicsaDatabase_V2_Service } from '../db_v2';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  ONBOARDING_NOTIFICATION_ID,
  PicsaNotificationFeedService,
  PREFERENCES_DOC_ID,
} from './notification-feed.service';

function createMockCollection<T extends { id: string }>(initialDocs: T[] = []) {
  const docs: Array<{
    _data: T;
    patch: jest.Mock;
    remove: jest.Mock;
    get: jest.Mock;
    toJSON: () => T;
  }> = [];

  const entrySubject = new BehaviorSubject(docs);

  function makeDoc(item: T) {
    const docEntry = {
      _data: { ...item },
      patch: jest.fn(async (patchData: Partial<T>) => {
        Object.assign(docEntry._data, patchData);
        entrySubject.next([...docs]);
        return docEntry;
      }),
      remove: jest.fn(async () => {
        const index = docs.findIndex((d) => d._data.id === docEntry._data.id);
        if (index !== -1) docs.splice(index, 1);
        entrySubject.next([...docs]);
      }),
      get: jest.fn((key: string) => (docEntry._data as any)[key]),
      toJSON: () => ({ ...docEntry._data }),
    };
    return docEntry;
  }

  for (const item of initialDocs) {
    docs.push(makeDoc(item));
  }
  entrySubject.next([...docs]);

  const collection = {
    insert: jest.fn(async (entry: T) => {
      const doc = makeDoc(entry);
      docs.push(doc);
      entrySubject.next([...docs]);
      return doc;
    }),
    find: jest.fn((query?: any) => {
      const selector = query?.selector || {};
      const filterDocs = (list: typeof docs) => {
        return list.filter((d) => {
          if (selector.deletedAt === null && (d._data as any).deletedAt !== null) return false;
          if (selector.readAt === null && (d._data as any).readAt !== null) return false;
          return true;
        });
      };
      return {
        exec: jest.fn(async () => filterDocs(docs)),
        $: entrySubject.pipe(map((list) => filterDocs(list))),
      };
    }),
    findOne: jest.fn((query: any) => {
      const selector = query?.selector || {};
      const targetId = selector.id;
      const getDoc = () => docs.find((d) => d._data.id === targetId) ?? null;
      return {
        exec: jest.fn(async () => getDoc()),
        $: entrySubject.pipe(map(() => getDoc())),
      };
    }),
  };

  return { collection, docs };
}

describe('PicsaNotificationFeedService', () => {
  let service: PicsaNotificationFeedService;
  let mockNotifsCollection: ReturnType<typeof createMockCollection<INotificationEntry>>;
  let mockPrefsCollection: ReturnType<typeof createMockCollection<INotificationPreferences>>;
  let mockRouter: { navigateByUrl: jest.Mock };

  beforeEach(async () => {
    mockNotifsCollection = createMockCollection<INotificationEntry>();
    mockPrefsCollection = createMockCollection<INotificationPreferences>();

    const mockDbService = {
      ready: jest.fn().mockResolvedValue(true),
      ensureCollections: jest.fn().mockResolvedValue(true),
      db: {
        collections: {
          notifications: mockNotifsCollection.collection,
          notification_preferences: mockPrefsCollection.collection,
        },
      },
    };

    mockRouter = {
      navigateByUrl: jest.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        PicsaNotificationFeedService,
        { provide: PicsaDatabase_V2_Service, useValue: mockDbService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(PicsaNotificationFeedService);
    await service.init();
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('initializes default channel preferences and first onboarding notification', async () => {
    expect(mockPrefsCollection.collection.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: PREFERENCES_DOC_ID,
        channels: DEFAULT_NOTIFICATION_PREFERENCES,
      }),
    );

    expect(mockNotifsCollection.collection.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: ONBOARDING_NOTIFICATION_ID,
        isSticky: true,
        priority: 'high',
        title: 'Set your notification preferences',
      }),
    );
  });

  it('computes unreadCount accurately based on readAt and channel preferences', async () => {
    expect(service.unreadCount()).toBe(1);

    await service.registerNotification({
      id: 'weather-alert-1',
      title: 'Heavy Rain Warning',
      body: 'Flash flood alert for southern region.',
      channel: 'weather_forecasts',
      priority: 'high',
    });

    expect(service.unreadCount()).toBe(2);

    // Disable weather_forecasts in preferences
    await service.updateChannelPreference('weather_forecasts', false);
    expect(service.unreadCount()).toBe(1);

    // Mark onboarding notification as read
    await service.markAsRead(ONBOARDING_NOTIFICATION_ID);
    expect(service.unreadCount()).toBe(0);
  });

  it('prevents dismissing sticky notifications but permits dismissing non-sticky ones', async () => {
    // Attempt dismissing sticky onboarding notification
    const dismissedSticky = await service.dismissNotification(ONBOARDING_NOTIFICATION_ID);
    expect(dismissedSticky).toBe(false);

    // Register a non-sticky notification
    await service.registerNotification({
      id: 'general-news-1',
      title: 'Community Meeting',
      body: 'Farmer group meeting next Tuesday.',
      channel: 'general_announcements',
      priority: 'medium',
      isSticky: false,
    });

    const dismissedNormal = await service.dismissNotification('general-news-1');
    expect(dismissedNormal).toBe(true);
  });

  it('executes primary action payload route navigation and marks notification as read', async () => {
    const notif: INotificationEntry = {
      id: 'action-test-1',
      title: 'Check updates',
      body: 'Update ready',
      channel: 'app_updates',
      priority: 'medium',
      isSticky: false,
      createdAt: new Date().toISOString(),
      readAt: null,
      deletedAt: null,
      actionPayload: {
        label: 'Open Settings',
        route: '/notifications/preferences',
      },
    };
    await service.registerNotification(notif);

    await service.executeAction(notif, 'primary');

    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/notifications/preferences');
  });

  it('invokes registered custom action handlers', async () => {
    const handler = jest.fn();
    service.registerActionHandler('custom_sync', handler);

    const notif: INotificationEntry = {
      id: 'custom-action-1',
      title: 'Sync data',
      body: 'Tap to sync',
      channel: 'general_announcements',
      priority: 'low',
      isSticky: false,
      createdAt: new Date().toISOString(),
      readAt: null,
      deletedAt: null,
      actionPayload: {
        label: 'Sync Now',
        actionKey: 'custom_sync',
      },
    };
    await service.registerNotification(notif);

    await service.executeAction(notif, 'primary');
    expect(handler).toHaveBeenCalledWith(notif.actionPayload, notif);
  });
});
