# Crop Probability Parser

Scripts to support parsing crop probability tables from docx files

Run directly with live-reload

```sh
npx tsx watch apps/picsa-server/scripts/crop-probability-parser/src/index.ts
```

## Input Data

Should be placed in `input` folder within 2-letter country folders, and subfolders by district subfolders.

If the district name can be identified from the subfolder it will be populated to output data

```
mw
 |  kasungu district sheets
 |  |   crop-probability.docx
```

## TODO

- [ ] Extract district and station ids
- [ ] Output as ts for inclusion in hardcoded data
- [ ] Migrate to dashboard syntax
