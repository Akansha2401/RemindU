# Android Development Build (Local)

How to build a **development build** of RemindU on your own machine and install it on a physical Android device, without the limits of Expo Go.

---

## Table of Contents

- [Why a Development Build](#why-a-development-build)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Build the APK](#build-the-apk)
- [Locate and Open the APK](#locate-and-open-the-apk)
- [Install on a Physical Device](#install-on-a-physical-device)
- [Run the App](#run-the-app)
- [When to Rebuild](#when-to-rebuild)
- [Troubleshooting](#troubleshooting)
- [Alternative: EAS Build (Cloud)](#alternative-eas-build-cloud)
- [Command Reference](#command-reference)

---

## Why a Development Build

Expo Go is a prebuilt app that only contains a fixed set of native modules. Anything outside that set, such as a library with custom native code or a feature Expo Go does not support (for example, remote push notifications), fails or is unavailable in Expo Go.

A development build is **your own app binary** with your project's native code compiled in. It behaves like the real app, and it still loads your JavaScript from the Expo dev server, so hot reload works as usual.

> [!NOTE]
> The steps below are a **local build**: `expo prebuild` generates the native Android project and Gradle compiles it on your machine. It needs Java and Android Studio, but no Expo account. For the cloud alternative, see [Alternative: EAS Build (Cloud)](#alternative-eas-build-cloud).

---

## Prerequisites

| Requirement | Why | Notes |
| ----------- | --- | ----- |
| **Bun** | Runs `bunx expo ...` commands | Already covered in the main setup |
| **Node.js LTS** | Expo tooling runs on it | Already covered in the main setup |
| **JDK 17** | Gradle needs Java to compile the app | Use version 17 specifically |
| **Android Studio** | Installs the Android SDK, build tools and `adb` | You do not need to write code in it |
| **`expo-dev-client`** | Turns the debug build into a development build | Installed in the project, see [Build the APK](#build-the-apk) |
| **Android phone** | Target device | Any modern phone works, see the architecture note below |

### 1. Install JDK 17

**macOS**

```shell
brew install --cask zulu@17
```

**Windows** (PowerShell as Administrator, requires [Chocolatey](https://chocolatey.org/install))

```shell
choco install -y microsoft-openjdk17
```

**Linux (Debian / Ubuntu)**

```shell
sudo apt install openjdk-17-jdk
```

Verify the version. It must print `17`:

```shell
java -version
```

### 2. Install Android Studio

1. Download and install [Android Studio](https://developer.android.com/studio).
2. On first launch, the **SDK Components Setup** screen appears. Click **Next** through the screens to install the Android SDK and the Android SDK Platform.
3. Open the **SDK Manager** (**Settings** > **Languages & Frameworks** > **Android SDK**) and confirm:
   - **SDK Platforms** tab: the latest Android SDK platform is installed.
   - **SDK Tools** tab: **Android SDK Build-Tools**, **Android SDK Command-line Tools** and **Android SDK Platform-Tools** are installed.
4. Note the **Android SDK Location** shown at the top of that screen. You need it in the next section.

---

## Environment Variables

Gradle finds Java and the Android SDK through `JAVA_HOME` and `ANDROID_HOME`. Both must be set.

**macOS** (add to `~/.zshrc`)

```shell
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
```

**Linux** (add to `~/.bashrc`)

```shell
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
```

> [!TIP]
> The JDK folder name differs by machine. Run `ls /usr/lib/jvm` to find yours.

**Windows** (Start menu > **Edit the system environment variables** > **Environment Variables**)

| Variable | Value |
| -------- | ----- |
| `JAVA_HOME` | Your JDK 17 install folder, for example `C:\Program Files\Microsoft\jdk-17.x.x-hotspot` |
| `ANDROID_HOME` | `%LOCALAPPDATA%\Android\Sdk` |
| `Path` (add new entry) | `%ANDROID_HOME%\platform-tools` |

Reload your terminal (or `source ~/.zshrc` / `source ~/.bashrc`), then verify:

```shell
echo $JAVA_HOME
echo $ANDROID_HOME
adb --version
```

On Windows PowerShell, use `echo $env:JAVA_HOME` and `echo $env:ANDROID_HOME`.

---

## Build the APK

Run everything below from the **project root** (the folder containing `package.json`).

**1. Install the dev client.** Skip this if `expo-dev-client` is already in `package.json`.

```shell
bunx expo install expo-dev-client
```

**2. Generate the native Android project.**

```shell
bunx expo prebuild --platform android
```

This creates an `android` folder in the project root.

> [!IMPORTANT]
> The `android` folder is generated output. Do not commit it and do not edit files inside it by hand. It is git-ignored in Expo projects by default. If you change native config (for example `app.json` plugins or permissions), regenerate it with `bunx expo prebuild --platform android --clean`.

**3. Build the debug APK.**

```shell
cd android
./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a
```

On Windows, use `gradlew.bat` instead of `./gradlew`:

```shell
gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a
```

The first build is slow because Gradle downloads its dependencies. Later builds are much faster.

> [!NOTE]
> `-PreactNativeArchitectures=arm64-v8a` compiles native code only for 64-bit ARM. That covers virtually all physical Android phones from the last several years and cuts build time and APK size. The resulting APK will **not** run on an x86 emulator. To build for every architecture, remove the flag.

When the build finishes, Gradle prints `BUILD SUCCESSFUL`.

---

## Locate and Open the APK

The generated APK is at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Open that folder from the project root:

**macOS**

```shell
open android/app/build/outputs/apk/debug
```

**Linux**

```shell
xdg-open android/app/build/outputs/apk/debug
```

**Windows**

```shell
explorer android\app\build\outputs\apk\debug
```

### Optional: open the project in Android Studio

You do not need this to build. It helps when you want to see Gradle errors in detail or manage SDK components.

1. In Android Studio, choose **File** > **Open**.
2. Select the **`android`** folder (not the project root).
3. Wait for the Gradle sync to finish.

---

## Install on a Physical Device

**1. Share the APK to your phone** with any file transfer method:

- Upload `app-debug.apk` to **Google Drive** and open the link on the phone.
- Send it through another file sharing tool, such as email or a messaging app that sends files as documents.

**2. Install it on the phone.**

1. Open the downloaded APK.
2. If Android blocks it, allow **Install unknown apps** for the app you opened it from (Drive, Chrome, Files) when prompted.
3. If **Google Play Protect** shows a warning, tap **Install anyway**. This is expected for a debug build that is not from the Play Store.

**Alternative: install over USB.** Enable **USB debugging** in the phone's Developer options, connect it, then run:

```shell
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

> [!WARNING]
> This is a **debug build for internal testing only**. Do not publish it or share it outside the team.

---

## Run the App

A debug build does not contain your JavaScript. It loads it from the Expo dev server, so the dev server must be running.

**1. Start the dev server** on your computer:

```shell
bun expo start --dev-client
```

**2. Connect the phone.** Make sure the phone and the computer are on the **same Wi-Fi network**, open the RemindU app on the phone, and select your dev server from the list (or scan the QR code shown in the terminal).

If the phone cannot reach the computer (for example, on a restricted or guest network), use one of these:

| Option | Command / action |
| ------ | ---------------- |
| Tunnel | `bun expo start --dev-client --tunnel` |
| USB | Run `adb reverse tcp:8081 tcp:8081`, then enter `http://localhost:8081` in the app's launcher |

---

## When to Rebuild

You do **not** need a new APK for every change.

| Change | Rebuild the APK? |
| ------ | ---------------- |
| Edit JavaScript / TypeScript, styles, screens | No. Hot reload through the dev server |
| Add or upgrade a package with native code | **Yes** |
| Change `app.json` native config (plugins, permissions, package name, icons) | **Yes**, run prebuild with `--clean` first |
| Upgrade the Expo SDK | **Yes** |

---

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| `JAVA_HOME is not set` or wrong Java version | Install JDK 17, set `JAVA_HOME`, restart the terminal, confirm with `java -version` |
| `SDK location not found` | Set `ANDROID_HOME`, or create `android/local.properties` containing `sdk.dir=<your SDK path>` |
| `You have not accepted the license agreements` | Run `$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses` and accept all |
| `./gradlew: Permission denied` (macOS / Linux) | Run `chmod +x gradlew` inside the `android` folder |
| App opens but cannot connect to the dev server | Confirm `bun expo start --dev-client` is running and both devices are on the same network, or use the tunnel or USB option |
| `App not installed` on the phone | Uninstall any older copy of the app first, then install again |
| Build fails after changing native config or packages | Run `bunx expo prebuild --platform android --clean`, then build again |

---

## Alternative: EAS Build (Cloud)

EAS Build compiles the app on Expo's servers, so you do not need Java or Android Studio locally. It requires an Expo account.

```shell
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile development
```

Make sure the `development` profile in `eas.json` has `developmentClient` set to `true`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    }
  }
}
```

When the build finishes, EAS gives you a QR code and a download link for the APK.

---

## Command Reference

| Task | Command |
| ---- | ------- |
| Install the dev client | `bunx expo install expo-dev-client` |
| Generate the native Android project | `bunx expo prebuild --platform android` |
| Regenerate after native config changes | `bunx expo prebuild --platform android --clean` |
| Build the debug APK (from `android/`) | `./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a` |
| APK location | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Install over USB | `adb install -r android/app/build/outputs/apk/debug/app-debug.apk` |
| Start the dev server for the dev build | `bun expo start --dev-client` |