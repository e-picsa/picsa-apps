# PICSA Data

Hardcoded data shared across tools

## Importing Icons

Corresponding icons for any data collection need to be imported into the app `project.json` file
Only import icon sets for the data used to save disk space

```json
{ "glob": "*.svg", "input": "libs/data/weather/svgs", "output": "assets/svgs/weather" },
{"glob": "*.svg", "input": "libs/data/crop_activity/svgs","output": "assets/svgs/crop_activity"},
```
