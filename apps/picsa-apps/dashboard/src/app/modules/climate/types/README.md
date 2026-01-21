# Climate Data Types

The climate data api runs on a remote server and exports endpoint definitions using the OpenAPI spec.

These definitions can be converted into typescript types on-demand using the command:

```sh
npx openapi-typescript "https://api.epicsa.idems.international/openapi.json" -o "apps/picsa-server/supabase/types/climate-api.types.ts"
```
