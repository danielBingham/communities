# Running the Mobile Apps

How to build and run the iOS and Android apps yourself, against your local
stack or another environment.

**Code:** `capacitor.config.js`, `ios/`, `android/`

## What You Need

- **iOS:** a Mac with Xcode and CocoaPods.
- **Android:** Android Studio, with an emulator or a device.
- The repository's dependencies installed (`npm ci`).

## Building

From the repository root, build the client for the environment the app
should talk to, which also syncs it into the native projects:

| Environment | Command | iOS scheme | Android flavor |
| ----------- | ------- | ---------- | -------------- |
| Your local stack | `npm run build-dev` | `App Local` | `local` |
| Staging | `npm run build-staging` | `App Staging` | `staging` |
| Production | `npm run build` | `App` | `production` |

Then open the native project:

```
npx cap open ios        # Xcode
npx cap open android    # Android Studio
```

In Xcode, pick the scheme; in Android Studio, the build variant for the
flavor. Run it on a simulator, emulator or device.

## Against Your Local Stack

The local variant talks to `https://localhost:3000`, so:

- run it where `localhost` reaches your machine (the iOS Simulator does);
- the simulator or emulator has to trust your local HTTPS certificate (see
  [Running Without Docker](running-without-docker.md));
- push notifications are logged rather than sent, by the local `log` push
  driver.

## After Changing Things

| You changed | Do |
| ----------- | -- |
| Client code | Rebuild (`npm run build-dev`) and run the app again. The local app also live-updates from the server when the version changes. |
| A Capacitor plugin or other native dependency | `npm ci`, rebuild, then rebuild the native project (`pod install` runs as part of `npx cap sync` on iOS). |
| `capacitor.config.js` | Rebuild, so `npx cap sync` writes the new configuration into the native projects. |

## Debugging

- **iOS:** Safari's Develop menu can inspect the app's WebView in the
  simulator.
- **Android:** Chrome's `chrome://inspect` can inspect the app's WebView.

Both show the console, so you'll see the client's logs there.
