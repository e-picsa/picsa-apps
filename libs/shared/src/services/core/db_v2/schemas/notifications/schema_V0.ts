import type { INotificationEntry, INotificationPreferences } from '@picsa/models';
import { RxJsonSchema } from 'rxdb';

import type { IPicsaCollectionCreator } from '../../models';

export const NOTIFICATIONS_SCHEMA_V0: RxJsonSchema<INotificationEntry> = {
  title: 'notifications',
  version: 0,
  keyCompression: false,
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    body: { type: 'string' },
    channel: {
      type: 'string',
      enum: ['weather_forecasts', 'agronomic_advisories', 'app_updates', 'general_announcements'],
    },
    priority: {
      type: 'string',
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    isSticky: { type: 'boolean', default: false },
    createdAt: { type: 'string' },
    readAt: { type: ['string', 'null'] },
    deletedAt: { type: ['string', 'null'] },
    actionPayload: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        route: { type: 'string' },
        url: { type: 'string' },
        actionKey: { type: 'string' },
        params: { type: 'object' },
      },
      required: ['label'],
    },
    secondaryActionPayload: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        route: { type: 'string' },
        url: { type: 'string' },
        actionKey: { type: 'string' },
        params: { type: 'object' },
      },
      required: ['label'],
    },
  },
  primaryKey: 'id',
  required: ['id', 'title', 'body', 'channel', 'priority', 'isSticky', 'createdAt'],
  indexes: ['createdAt'],
};

export const NOTIFICATION_PREFERENCES_SCHEMA_V0: RxJsonSchema<INotificationPreferences> = {
  title: 'notification_preferences',
  version: 0,
  keyCompression: false,
  type: 'object',
  properties: {
    id: { type: 'string' },
    channels: {
      type: 'object',
      properties: {
        weather_forecasts: { type: 'boolean' },
        agronomic_advisories: { type: 'boolean' },
        app_updates: { type: 'boolean' },
        general_announcements: { type: 'boolean' },
      },
      required: ['weather_forecasts', 'agronomic_advisories', 'app_updates', 'general_announcements'],
    },
    updatedAt: { type: 'string' },
  },
  primaryKey: 'id',
  required: ['id', 'channels', 'updatedAt'],
};

export const NOTIFICATIONS_COLLECTION: IPicsaCollectionCreator<INotificationEntry> = {
  schema: NOTIFICATIONS_SCHEMA_V0,
  isUserCollection: true,
  syncPush: false,
};

export const NOTIFICATION_PREFERENCES_COLLECTION: IPicsaCollectionCreator<INotificationPreferences> = {
  schema: NOTIFICATION_PREFERENCES_SCHEMA_V0,
  isUserCollection: true,
  syncPush: false,
};
