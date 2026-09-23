/* eslint-disable @typescript-eslint/no-explicit-any */
import { getValidator } from 'rxdb/plugins/validate-ajv';

import { NOTIFICATION_PREFERENCES_SCHEMA, NOTIFICATIONS_SCHEMA } from './index';

const validateNotification = getValidator(NOTIFICATIONS_SCHEMA);
const validatePreferences = getValidator(NOTIFICATION_PREFERENCES_SCHEMA);

const validNotification = {
  id: 'notif-123',
  title: 'Test Notification',
  body: 'This is a test notification body.',
  channel: 'weather_forecasts',
  priority: 'high',
  isSticky: false,
  createdAt: '2026-09-23T10:00:00.000Z',
  readAt: null,
  deletedAt: null,
  actionPayload: {
    label: 'View Advisory',
    route: '/climate',
  },
};

const validPreferences = {
  id: 'user_preferences',
  channels: {
    weather_forecasts: true,
    agronomic_advisories: true,
    app_updates: false,
    general_announcements: true,
  },
  updatedAt: '2026-09-23T10:00:00.000Z',
};

describe('notifications schema', () => {
  it('accepts a valid notification document', () => {
    const result = validateNotification(validNotification);
    expect(result).toEqual([]);
  });

  it('rejects a document missing required fields', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { title, ...rest } = validNotification;
    const result = validateNotification(rest as any);
    expect(result.length).toBeGreaterThan(0);
  });

  it('rejects invalid channel', () => {
    const invalid = { ...validNotification, channel: 'invalid_channel' };
    const result = validateNotification(invalid as any);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('notification_preferences schema', () => {
  it('accepts valid notification preferences', () => {
    const result = validatePreferences(validPreferences);
    expect(result).toEqual([]);
  });

  it('rejects preferences missing a required channel', () => {
    const invalid = {
      ...validPreferences,
      channels: {
        weather_forecasts: true,
      },
    };
    const result = validatePreferences(invalid as any);
    expect(result.length).toBeGreaterThan(0);
  });
});
