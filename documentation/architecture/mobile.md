# Mobile

Orientation for the iOS and Android apps: the web client, running in a
native WebView that [Capacitor](https://capacitorjs.com/) provides, with
plugins for the native features it needs. Running them yourself is in
[Running the Mobile Apps](../getting-started/running-the-mobile-apps.md).

## Where Things Are

| Path | What's there |
| ---- | ------------ |
| `capacitor.config.js` | Capacitor's configuration, at the repository root. |
| `ios/`, `android/` | The native projects (an Xcode workspace, a Gradle project), generated and mostly managed by Capacitor. |
| `web-application/client/lib/native/` | The client's wrappers around the native plugins. |
| `assets/` | Source images for the app icons and splash screens. |

## Variants

`capacitor.config.js` picks the native variant from `NODE_ENV` at build
time. Each has its own app id, so all three can be installed side by side:

| `NODE_ENV` | Build with | iOS scheme | Android flavor | Talks to |
| ---------- | ---------- | ---------- | -------------- | -------- |
| `production` | `npm run build` | `App` | `production` | `communities.social` |
| `staging` | `npm run build-staging` | `App Staging` | `staging` | `staging.communities.social` |
| `development` | `npm run build-dev` | `App Local` | `local` | `localhost:3000` |

The build scripts build the client, then run `npx cap sync`, which copies
the build into the native projects and writes `capacitor.config.json` into
each from `capacitor.config.js`. Those copies are generated and ignored by
git.

## Native Projects and Plugins

- **Change by hand, in Xcode or Android Studio:** per-variant settings
  (iOS schemes, `Info.plist` files and entitlements; Android flavors in
  `android/app/build.gradle`), push notification and deep link setup, and
  icons. Commit what they change, and check all three variants still build.
- **Leave to Capacitor:** copied web assets, generated configuration and
  plugin registration.
- **Plugins** are dependencies of the repository root, which the native
  projects build against, and of `web-application`, which imports them.
  Keep their versions the same in both `package.json` files.
- **Icons and splash screens** are generated from `assets/` with
  `npx capacitor-assets generate`, which also makes the web icons in
  `icons/`.

## Sessions and Push

The apps carry the session ID in a header rather than a cookie, and keep
it in the device's secure storage (see [Server](server.md#sessions)).
Logged-in pages register for push notifications and send the device's
token to the server, which keeps it with the session.

## Live Updates

The apps update their web bundle without a store release. On each
navigation the client compares its version with the server's
(`GET /system/version`, in `useVersion`); if they differ, the web client
reloads, and the apps download `<host>/dist/dist.zip` with Capgo's
`CapacitorUpdater` and switch to it. `index.js` tells the updater a new
bundle started, and a bundle that never does is rolled back.

A live update only replaces the web bundle. These need a store release,
which maintainers make:

- adding, removing or upgrading a Capacitor plugin, or any other native
  code;
- changes in `ios/` or `android/`;
- changes to `capacitor.config.js`.

Client code that depends on a newer native build has to check the build
it's running in (`state.system.appBuild`) and fall back for older ones,
since people update apps on their own schedule.
