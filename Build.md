# Android Builds (Local)

How to build RemindU on your own machine: a **development build** (APK for testing on your phone) and a **release build** (AAB for the Google Play Store).

Both run Gradle directly instead of `eas build --local`. That is much faster: `eas build --local` copies the project to a temp folder, reinstalls dependencies, regenerates `android/` and compiles everything from scratch every time, while Gradle reuses the previous build's output.

For first-time machine setup (JDK 17, Android Studio, `JAVA_HOME` / `ANDROID_HOME`) and installing an APK on a phone, see the [Android Development Build guide](./Eas.md).

---

## Table of Contents

- [Which Build Do I Need](#which-build-do-i-need)
- [Development Build (APK)](#development-build-apk)
- [Release Build (AAB)](#release-build-aab)
  - [One-time Setup: Upload Key](#one-time-setup-upload-key)
  - [Build the AAB](#build-the-aab)
  - [After Uploading to Play](#after-uploading-to-play)
- [When to Run Prebuild](#when-to-run-prebuild)
- [How Release Signing Works](#how-release-signing-works)
- [Troubleshooting](#troubleshooting)
- [Command Reference](#command-reference)

---

## Which Build Do I Need

| | Development build | Release build |
| --- | --- | --- |
| Purpose | Test on your own phone with hot reload | Publish on the Play Store |
| Gradle task | `assembleDebug` | `bundleRelease` |
| Output | `.apk` | `.aab` |
| JavaScript | Loaded from the dev server (`bun expo start --dev-client`) | Bundled inside the app |
| Signed with | Debug key | Play upload key |
| Architectures | `arm64-v8a` (fastest) | `armeabi-v7a,arm64-v8a` |

---

## Development Build (APK)

Run from the **project root**:

```shell
bunx expo prebuild --platform android
cd android
./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a
```

The APK is at `android/app/build/outputs/apk/debug/app-debug.apk`. Install it on the phone (USB: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`), then start the dev server:

```shell
bun expo start --dev-client
```

Full details: [Eas.md](./Eas.md).

---

## Release Build (AAB)

### One-time Setup: Upload Key

Play only accepts updates signed with the same **upload key** as the first release. RemindU's key was created by EAS, so download it from there. Do this once per machine.

**1. Download the keystore from EAS.**

```shell
bunx eas-cli credentials -p android
```

Choose **production** > **Keystore: Manage everything needed to build your project** > **Download existing keystore**, and answer **yes** to *display the sensitive information*. It saves a `.jks` file in the project root and prints the **key alias**, **keystore password** and **key password**.

**2. Move the keystore out of the project.**

```shell
mkdir -p ~/keys
mv @fsk196__remindu.jks ~/keys/remindu-upload.jks
chmod 600 ~/keys/remindu-upload.jks
```

> [!WARNING]
> Never commit the keystore or its passwords (`*.jks` is git-ignored). Back up the file and the passwords somewhere off your laptop, such as a password manager. EAS also keeps a copy.

**3. Add the key to `~/.gradle/gradle.properties`** (your user-level Gradle config, not the one in `android/`). Create the file if it does not exist, and use the values EAS printed:

```properties
REMINDU_UPLOAD_STORE_FILE=/home/<you>/keys/remindu-upload.jks
REMINDU_UPLOAD_KEY_ALIAS=<key alias>
REMINDU_UPLOAD_STORE_PASSWORD=<keystore password>
REMINDU_UPLOAD_KEY_PASSWORD=<key password>
```

```shell
chmod 600 ~/.gradle/gradle.properties
```

**4. Check the signing setup.**

```shell
cd android
./gradlew :app:signingReport
```

Under `Variant: release`, `Store` must point to `~/keys/remindu-upload.jks` and the `SHA1` must match the fingerprint shown by `bunx eas-cli credentials` (`59:C2:05:70:FB:...`).

### Build the AAB

**1. Find the next version code.** Every Play upload needs a higher `versionCode` than the last one. EAS keeps the counter:

```shell
bunx eas-cli build:version:get -p android
```

The next build uses that number **+ 1**.

**2. Bump the version name** (optional, the version users see) in `app.json` > `expo.version`, for example `1.0.0` > `1.0.1`, then run prebuild (see [When to Run Prebuild](#when-to-run-prebuild)).

**3. Build.** Replace `5` with your version code:

```shell
cd android
./gradlew bundleRelease -PversionCode=5 -PreactNativeArchitectures=armeabi-v7a,arm64-v8a
```

The AAB is at:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

> [!IMPORTANT]
> If the build prints `REMINDU_UPLOAD_STORE_FILE not set: release build is signed with the debug key`, the upload key was not found. Play will reject that AAB. Fix `~/.gradle/gradle.properties` and build again.

**Why two architectures:** Play delivers only the part each phone needs, and `arm64-v8a` alone leaves out 32-bit phones. `x86` / `x86_64` (emulators, a few Chromebooks) are skipped to save build time.

### After Uploading to Play

Upload `app-release.aab` in the Play Console, then tell EAS which version code you used so its counter stays in step (otherwise a future `eas build` could reuse a number Play already has):

```shell
bunx eas-cli build:version:set -p android
```

Enter the same version code (for example `5`).

---

## When to Run Prebuild

`android/` is generated from `app.json` and config plugins. Regenerate it only when native config changes:

| Change | What to run |
| ------ | ----------- |
| JavaScript / TypeScript, styles, screens | Nothing for dev builds. For a release, just `bundleRelease` again |
| `app.json` (version, plugins, permissions, icons, splash) | `bunx expo prebuild --platform android` |
| Add, remove or upgrade a package with native code | `bunx expo prebuild --platform android` |
| Build fails in strange ways after native changes | `bunx expo prebuild --platform android --clean` |

> [!TIP]
> `--clean` deletes `android/` including the build cache, so the next build is slow again. Use it only when a normal prebuild is not enough.

---

## How Release Signing Works

The plugin `plugins/with-release-signing.js` (registered in `app.json`) edits `android/app/build.gradle` during prebuild:

- Adds a `release` signing config that reads `REMINDU_UPLOAD_*` from `~/.gradle/gradle.properties`, so no secrets live in the repo.
- Falls back to the debug key (with a warning) when those properties are missing, so release builds still work on machines without the key.
- Makes `versionCode` overridable with `-PversionCode=N`, so a release does not need an `app.json` edit and a prebuild just to bump it.

Do not edit `android/` by hand: the next prebuild overwrites it. Change the plugin instead.

---

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| `REMINDU_UPLOAD_STORE_FILE not set` warning | Check `~/.gradle/gradle.properties` exists and the property names are spelled exactly as above |
| `Keystore was tampered with, or password was incorrect` | Wrong keystore password. Re-run `bunx eas-cli credentials` and show the sensitive information |
| `Cannot recover key` | Wrong key password or alias |
| Play: *Version code N has already been used* | Build again with a higher `-PversionCode` |
| Play: *signed with the wrong key* | The AAB was not signed with the EAS upload key. Run `./gradlew :app:signingReport` and compare the SHA1 |
| Build ignores a change in `app.json` | Run `bunx expo prebuild --platform android` before building |

More fixes for Java, SDK and device issues: [Eas.md > Troubleshooting](./Eas.md#troubleshooting).

---

## Command Reference

| Task | Command |
| ---- | ------- |
| Regenerate `android/` | `bunx expo prebuild --platform android` |
| Development APK (from `android/`) | `./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a` |
| Current version code on EAS | `bunx eas-cli build:version:get -p android` |
| Release AAB (from `android/`) | `./gradlew bundleRelease -PversionCode=N -PreactNativeArchitectures=armeabi-v7a,arm64-v8a` |
| Check release signing (from `android/`) | `./gradlew :app:signingReport` |
| Sync version code to EAS | `bunx eas-cli build:version:set -p android` |
| Download the upload key | `bunx eas-cli credentials -p android` |
| APK location | `android/app/build/outputs/apk/debug/app-debug.apk` |
| AAB location | `android/app/build/outputs/bundle/release/app-release.aab` |
