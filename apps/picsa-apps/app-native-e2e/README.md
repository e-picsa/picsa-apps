# Android E2E Testing with WebdriverIO & Appium

This project (`apps/picsa-apps/app-native-e2e`) contains the end-to-end test suite for the Picsa Native Android App. It uses WebdriverIO as the test runner and Appium to automate testing on Android devices/emulators.

## Prerequisites

1.  **Java Development Kit (JDK)**: JDK 11 or higher is required.
2.  **Android Studio**: Install the Android SDK and Command Line Tools.
3.  **Environment Variables**:
    - `ANDROID_HOME`: Set to your Android SDK path (e.g., `C:\Users\YourUser\AppData\Local\Android\Sdk`).
    - Add the following to your `PATH`:
      - `%ANDROID_HOME%\platform-tools`
      - `%ANDROID_HOME%\cmdline-tools\latest\bin` (or `...tools\bin`)
      - `%ANDROID_HOME%\emulator`

## Setup & Running Locally

### 1. Start an Android Emulator

1.  Open **Android Studio**.
2.  Navigate to **Tools** > **Device Manager**.
3.  **Create Device** (if you haven't already):
    - Choose a Phone definition (e.g., Pixel 5).
    - Select a System Image (e.g., API 30 or higher).
    - Finish the setup.
4.  **Launch the Emulator**: Click the "Play" button next to your device.
    > **Important**: Ensure the emulator is running _before_ starting the tests.

### 2. Run the Tests

Execute the E2E test suite:

```bash
nx run picsa-apps-app-native-e2e:e2e
```

This will automatically build device apk and run tests

**What happens next?**

- The build target ensures the APK is up-to-date.
- WebdriverIO launches and connects to the running Appium server (or starts one).
- Appium installs the APK onto the emulator.
- The tests defined in `src/specs` are executed.
- Screenshots are saved to `apps/picsa-apps/app-native-e2e/screenshots`.

## Test Development

If a debug apk has already been built, tests can be run independent of build via

```sh
cd apps/picsa-apps/app-native-e2e
yarn wdio run wdio.conf.ts
```

## Troubleshooting

- **"Couldn't find plugin appium service"**: Ensure `@wdio/appium-service` is installed in `devDependencies`.
- **App Not Installing**: Verify the emulator is unlocked and has enough storage space.
- **JDK Errors**: Run `java -version` to verify you are using a compatible JDK version.

- **APK Errors**:
  Check the test runner has generates the APK at:  
  `apps/picsa-apps/app-native/android/app/build/outputs/apk/debug/app-debug.apk`

You can build it explicitly:

```bash
nx run picsa-apps-app-native:build-debug-apk
```
