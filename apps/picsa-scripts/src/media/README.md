## Media Scripts

These are designed to standardise video files used in PICSA, including audio level normalisation, file size compression and thumbnail generation

## Instruction

1. Add videos for processing to the `./input` folder

2. Run processing scripts

```sh
yarn scripts media/process
```

This will run both audio normalisation and video compression scripts

## Standalone Scripts

Each script can also be run standalone, however successive processing will require output files copied back into input folder

```sh
yarn scripts media/normalise-audio
```

```sh
yarn scripts media/compress-video
```
