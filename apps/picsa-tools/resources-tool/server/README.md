# Resources Tool Server

Files in this folder are only used as a temporary location for extracting metadata before populating to the server

```sh
yarn ts-node tools/workflows/populateResourceContents.ts --skip-nx-cache
```

Eventually these methods will be removed once using server-side code that can populate md5Checksum and size metadata
