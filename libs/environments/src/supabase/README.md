# Supabase Config

## Setup

A supabase config file will automatically be populated as part of the server `seed` action

```bash
yarn nx run picsa-server:seed
```

## App Integration

Ensure app `project.json` includes config asset and production file replacements

```json
{
  "targets": {
    "build": {
      "options": {
        "assets": [
          {
            "glob": "supabase.config.json",
            "input": "libs/assets",
            "output": "assets"
          }
        ]
      },
      "configurations": {
        "production": {
          "fileReplacements": [
            {
              "replace": "libs/environments/src/supabase/supabase.config.json",
              "with": "libs/environments/src/supabase/supabase.config.prod.json"
            }
          ]
        }
      }
    }
  }
}
```

## CI

When running build on CI production config should be populated, e.g.

```yml
- name: Populate supabase config
  env:
    SUPABASE_PROJECT_ID: ${{ vars.SUPABASE_PROJECT_ID }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  run: |
    jq -n \
      --arg apiUrl "https://${SUPABASE_PROJECT_ID}.supabase.co" \
      --arg anonKey "$SUPABASE_ANON_KEY" \
      '{apiUrl: $apiUrl, anonKey: $anonKey}' \
      > libs/environments/src/supabase/supabase.config.prod.json
```
