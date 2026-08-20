# 1001 Dates — Android (Capacitor)

This branch keeps the public web app unchanged and adds a separate Android-only UI layer.

## Android-only functionality

The Android bundle restores the last pre-removal implementation of:

- saved full date plans;
- selected-date history;
- Saved / History / Places tabs;
- heart button for a whole date plan;
- favorite individual places;
- the "Не повторять места" filter;
- visited-place IDs influencing future recommendations.

These files live under `mobile/` and are copied into `dist/` only for the Capacitor build. Root `index.html` and `app-final.js` remain the current web version.

## Requirements

- Node.js 22+
- Android Studio with Android SDK 36
- JDK required by the installed Android Studio / Gradle version

## First Android project generation

```bash
npm install
npm run android:init
npm run android:open
```

`android:init` builds `dist/` first and then runs `cap add android`.

## After changing web/mobile code

```bash
npm run android:sync
npm run android:open
```

## Build an Android App Bundle

In Android Studio:

1. Open the generated `android/` project.
2. Let Gradle sync finish.
3. Use **Build > Generate Signed App Bundle or APK > Android App Bundle**.
4. Create or select a release keystore and keep it backed up securely.
5. Build the `release` bundle.

The resulting `.aab` is the file uploaded to Google Play Console.

## Important separation

Do not replace root `index.html` or root `app-final.js` with files from `mobile/`. The root files are the website. The `mobile/` files are Android-only source overrides.
