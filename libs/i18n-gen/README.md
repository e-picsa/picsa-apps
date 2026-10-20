# i18n

Manage strings for translation within the app

## Generate Strings

A list of all strings used by the app can be generated via

```bash
yarn i18n
```

This will be stored in the [templates](./templates/) folder, to be uploaded to the admin dashboard

## Populate Translations

Pull the latest translations directly from the database:

```bash
yarn scripts:translations:sync [--country=mw] [--locale=mw_ny] [--local] [--audit-only]
```

This writes the per-locale JSON files to [assets](../i18n/assets/) and mirrors the admin dashboard "Export All" output.

Alternatively, export from the admin dashboard and copy the generated files to the [i18n assets](../i18n/assets/) folder

## Use in app

1. Ensure translation assets included in app

```json
{
  "glob": "*.json",
  "input": "libs/i18n/assets",
  "output": "assets/i18n"
},
```

2. Ensure module imported into main `app.config.ts` or `app.module.ts`

_App.config.ts_

```ts
export const appConfig: ApplicationConfig = {
  providers: [importProvidersFrom(PicsaTranslateModule.forRoot())],
};
```

or
_App.module.ts_

```ts
@NgModule({
  imports: [PicsaTranslateModule.forRoot()];
})
```

3. Include module in components

```ts

@Component({
  imports: [PicsaTranslateModule]
})
```

## Developers

See additional info in developer [documentation](https://docs.picsa.app/translations)
