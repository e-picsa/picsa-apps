# Hardcoded Resources

Files in this folder can be hardcoded into every build. If updating should populate via

```sh
yarn ts-node tools/workflows/populateResourceContents.ts --skip-nx-cache
```

## Previewing Changes

By default resources only update on new version release. This can temporarily be bypassed by commenting out the corresponding service code

```ts
const assetsCacheVersion = this.getAssetResourcesVersion();
if (assetsCacheVersion === APP_VERSION.number) {
  return;
}
```
