# Native Features

The Capacitor plugins the client uses, what for, and where. Everything else
in the apps is the same code as the web.

**Code:** `web-application/client/`, `package.json`

## Detecting the Platform

`Capacitor.getPlatform()` is `web`, `ios` or `android`;
`Capacitor.isNativePlatform()` (or `isNativePlatform()` from `/lib/native`)
says whether it's an app. Guard every plugin call with one of them: on the
web, most plugins aren't available.

## Plugins

| Plugin | For | Used in |
| ------ | --- | ------- |
| `capacitor-secure-storage-plugin` | Keeping the session ID (`auth-token`) in the device's secure storage, since cookies don't work in the WebView. | `state/lib/makeRequest.js`, `lib/Socket.js`, `state/authentication.js` |
| `@capacitor/push-notifications` | Registering for push notifications, and handling them. | `lib/hooks/useNotifications.js`, `state/notifications.js` |
| `@capawesome/capacitor-badge` | The unread count on the app icon. | `lib/notification/badge.js` |
| `@capacitor/app` | App info (version, build), opening links in the app, and foreground and background changes. | `lib/hooks/useDevice.js`, `lib/hooks/useNativeDeepLinks.js`, `lib/hooks/useAppState.js` |
| `@capacitor/device` | Device info for the server. | `lib/hooks/useDevice.js` |
| `@capgo/capacitor-updater` | Live updates of the web bundle. See [Live Updates](live-updates.md). | `index.js`, `lib/hooks/useVersion.js` |
| `@capacitor/status-bar` | The status bar's style. | `index.js` |
| `@capacitor/text-zoom` | Honoring the device's text size: read it, store it, and apply it to content rather than the whole WebView. | `App.js`, `lib/hooks/useAppState.js` |
| `@capacitor/clipboard` | Copying links and MFA secrets. | `CopyLink` components, `MultifactorAuthenticationSecret` |

## Sessions in the Apps

1. Every request sends `X-Communities-Platform: ios` (or `android`).
2. The server sends the session ID back in `X-Communities-Auth` instead of a
   cookie; `makeRequest()` saves it to secure storage.
3. Later requests, and the WebSocket, send it back.
4. A 401, or logging out, clears it.

See [Sessions and CSRF](../server/sessions-and-csrf.md).

## Push Notifications

1. `useNotifications()` asks for permission and registers with
   `PushNotifications.register()`.
2. On registration, it sends the device token to the server with
   `PATCH /device`, which stores it in the session, with the platform
   (`DeviceController`).
3. To push to a user, the worker's push drivers find their sessions and
   send to each device token they hold, through APNs or FCM.
4. The app syncs (iOS) or clears (Android) delivered notifications and the
   badge when it opens.

Because device tokens live in sessions, a user only gets pushes on devices
they're logged in on.

## Deep Links

Links to the site open in the app (iOS universal links, Android app
links), verified by the files the server serves at
`/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json`
for each variant. `useNativeDeepLinks()` routes the link to the right page.

## The Device Record

`useDevice()` sends the platform, app version and build to the server
(`PATCH /device`), which keeps them in the session. The client keeps the
build number too (`state.system.appBuild`), to enable features only on
builds that support them (text zoom needs build 19 or later).
