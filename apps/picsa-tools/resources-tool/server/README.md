# Resources Tool Server

Files in this folder are only used as a temporary location for extracting metadata before populating to the server

```sh
yarn tsx tools/workflows/populateResourceContents.ts
```

Eventually these methods will be removed once using server-side code that can populate md5Checksum and size metadata

## Previewing Changes

By default resources only update on new version release. This can temporarily be bypassed by commenting out the corresponding service code

```ts
const assetsCacheVersion = this.getAssetResourcesVersion();
if (assetsCacheVersion === APP_VERSION.number) {
  return;
}
```
