## Media Scripts

These are designed to standardise video files used in PICSA, including audio level normalisation, file size compression and thumbnail generation

## Instruction

1. Add videos for processing to the `./input` folder

2. Normalise audio

```sh
yarn scripts media/normalise-audio
```

3. Copy process files from `./output` back to `./input` for next processing

4. Compress video

```sh
yarn scripts media/compress-video
```

## TODO

- [ ] Single script to handle processing in series
