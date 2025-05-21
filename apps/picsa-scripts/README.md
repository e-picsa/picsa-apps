# PICSA Scripts

Workspace to call utility scripts

```sh
yarn scripts [scriptName]
```

## Specifying Script

If the script is in folder `src/test/script1.ts` call via

```sh
yarn scripts test/script1
```

If using a top-level script of folder within index.ts such as `src/test/index.ts` or `scr/test.ts` can simply call by name

```sh
yarn scripts test
```

## Watch Configuration

Run the alternative `yarn scripts:watch` command to run a script with live-reload, e.g.

```sh
yarn scripts:watch test/script1
```
