To run on a device with live-reload first configure a local server to connect to via `apps\picsa-apps\extension-app-native\capacitor.config.ts`

Sync the changes to capacitor via the project build script.

```
yarn nx run picsa-apps-extension-app-native:build
```

Start the local server via the `external` configuration defined in `apps\picsa-apps\extension-app\project.json`

```
yarn nx run picsa-apps-extension-app:serve --configuration=external
```

Run the app from android studio either on an emulator or physical device

The app should livereload both on local network and device