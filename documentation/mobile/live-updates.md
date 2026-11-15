# Live Updates

How the apps pick up a new version of the client without a store release,
and how the web client does the same.

**Code:** `web-application/client/lib/hooks/useVersion.js`,
`web-application/client/index.js`, `web-application/server/app.js`,
`capacitor.config.js`

## How It Works

Every client knows its version, from the `communities-version` meta tag
webpack writes into `index.html`. Every release builds the client and the
server with the same version.

1. **On every navigation**, `useVersion()` (in `RootLayout`) asks the
   server for its version (`GET /system/version`).
2. **If they differ:**
   - **On the web**, the page reloads, getting the new bundle.
   - **In the apps**, `CapacitorUpdater.download()` fetches the new bundle
     from `<host>/dist/dist.zip` (built with every client build and served
     by Express), and `CapacitorUpdater.set()` switches to it, reloading
     the app.
3. **When the app starts**, `index.js` calls
   `CapacitorUpdater.notifyAppReady()`, telling the updater the bundle
   loaded. A bundle that never does is rolled back.

`autoUpdate` is off in `capacitor.config.js`: the client decides when to
update, by comparing versions.

## What Needs a Store Release

A live update replaces only the web bundle. These need a new build of the
native app, released through the App Store and Google Play by maintainers:

- adding, removing or upgrading a Capacitor plugin, or anything else that
  changes native code;
- changes in `ios/` or `android/`: permissions, entitlements, deep link
  domains, icons, splash screens;
- changes to `capacitor.config.js`.

Client code that depends on a newer native build has to check the build
it's running in (`state.system.appBuild`) and fall back for older ones,
since people update apps on their own schedule.

## Things to Know

- **The client and server must be released together.** A client older or
  newer than the server will update itself straight away.
- **Version mismatches happen in development too**: after a version bump,
  rebuild the containers (`docker compose build`) so the dev server and
  Express agree, or the page will keep reloading.
