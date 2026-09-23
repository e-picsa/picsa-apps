export type INotificationChannel =
  | 'weather_forecasts'
  | 'agronomic_advisories'
  | 'app_updates'
  | 'general_announcements';

export type NotificationPriority = 'high' | 'medium' | 'low';

export interface INotificationAction {
  label: string;
  route?: string;
  url?: string;
  actionKey?: string;
  params?: Record<string, unknown>;
}

export interface INotificationEntry {
  id: string;
  title: string;
  body: string;
  channel: INotificationChannel;
  priority: NotificationPriority;
  isSticky: boolean;
  createdAt: string;
  readAt: string | null;
  deletedAt: string | null;
  actionPayload?: INotificationAction;
  secondaryActionPayload?: INotificationAction;
}

export type INotificationCreateInput = Omit<
  INotificationEntry,
  'createdAt' | 'readAt' | 'deletedAt' | 'priority' | 'isSticky'
> & {
  priority?: NotificationPriority;
  isSticky?: boolean;
  createdAt?: string;
  readAt?: string | null;
  deletedAt?: string | null;
};

export interface INotificationPreferences {
  id: string; // e.g. 'user_preferences'
  channels: Record<INotificationChannel, boolean>;
  updatedAt: string;
}
