# enketo-webform

This is a loose export of enketo-core and openrosa-xpath-evaulator, compiled into a webcomponent

This benefits of this are being able to rewrite in typescript, and support bundling with local bundlers/treeshaking (default npm build in iife format)

In addition it allows for various size optimisations

```
"enketo-core": "6.1.3",
"openrosa-xpath-evaluator": "2.0.13",
```

Core modifications

- Rewrite JS to TS, attempt method migration
-

Additional optimisations

- Import openrosa locally, thereby removing node-forge peer dep (will fail if required for 'digest' operations, but hopefully these won't be nceesarry and the bundle adds around 1MB)
- Comment out geopicker widget, removing leaflet dep (around 500kb)

This reduces the overall bundle from 2.5MB to 1MB (140KB compressed).

Recommended further optimisations

- Comment out draw widget (20kb)
- Refactor date/time picker widgets to use native html elements (100kb)

## Known Issues

**Testing**
Cannot integrate nxext stencil test as does not (currently) support jest 28

<!-- Auto Generated Below -->

## Properties

| Property             | Attribute      | Description                                           | Type      | Default     |
| -------------------- | -------------- | ----------------------------------------------------- | --------- | ----------- |
| `form` _(required)_  | `form`         | HTML form template                                    | `string`  | `undefined` |
| `model` _(required)_ | `model`        | XML form model, as processed by an Enketo Transformer | `string`  | `undefined` |
| `showButtons`        | `show-buttons` |                                                       | `boolean` | `true`      |

## Events

| Event         | Description | Type                             |
| ------------- | ----------- | -------------------------------- |
| `dataUpdated` |             | `CustomEvent<IEventDataUpdated>` |
| `formSaved`   |             | `CustomEvent<IEventFormSaved>`   |

---

_Built with [StencilJS](https://stenciljs.com/)_
