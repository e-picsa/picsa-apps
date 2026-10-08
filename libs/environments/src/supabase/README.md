# Supabase Config

## Setup

A supabase config file will automatically be populated as part of the server `db:seed` action

```bash
yarn nx run picsa-server:db:seed
```

## App Integration

Ensure app `project.json` includes config asset and nx includes when calculating hash for caching

```json
{
  "targets": {
    "build": {
      "inputs": ["default", "supabaseConfig"],
      "options": {
```
