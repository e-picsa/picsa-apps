# Notification Feed & Preferences Service

## Overview

The Notification Feed system provides a unified, persistent, offline-first notification bus for the PICSA application. It replaces ephemeral snackbars and dismissible top banners with a dedicated notification feed (`/notifications`) and fine-grained channel preferences (`/notifications/preferences`).

## Architecture

- **RxDB Collections**:
  - `notifications`: Stores notification entries (`INotificationEntry`), their read/dismissed status, priorities, sticky state, and primary/secondary action payloads.
  - `notification_preferences`: Stores user channel toggles (`weather_forecasts`, `agronomic_advisories`, `app_updates`, `general_announcements`).
- **`PicsaNotificationFeedService`**:
  - Located in `libs/shared/src/services/core/notifications/notification-feed.service.ts`.
  - Exposes reactive signals: `notifications`, `preferences`, `activeNotifications` (filtered by user channel settings), and `unreadCount`.
  - Automatic Onboarding: Seeds a sticky, high-priority notification guiding users to set up preferences on initial run.
  - Action Registration & Execution: Services can attach primary/secondary actions with route transitions or custom action handlers (`registerActionHandler`).
  - Sticky Protection: Prevents users from dismissing required or active system notices (`isSticky: true`).
  - Developer Tools: `seedDevSamples()` to quickly generate test advisories and forecasts.
- **UI Components**:
  - `PicsaHeaderComponent`: Displays a bell icon with dynamic unread badge linking to `/notifications`.
  - `NotificationFeedPageComponent`: Filterable feed list (`All` / `Unread`) with channel badges, priority styling, and action buttons.
  - `NotificationPreferencesPageComponent`: Device push notification permission detector and individual channel opt-in/opt-out toggles.
