# PICSA Server

See docs at: https://docs.picsa.app/advanced/server/setup

## Notes

- self-hosted docker version (docker folder) vs cli-based docker version (supabase folder)

## Prerequisites

- Docker Desktop
- [Deno](https://docs.deno.com/runtime/manual/getting_started/installation)
- [Deno VSCode Extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno)

## Quickstart

**Start Server**

```sh
yarn nx run picsa-server:supabase start
```

This will start various backend services within docker containers

API URL: http://localhost:54321
GraphQL URL: http://localhost:54321/graphql/v1
DB URL: postgresql://postgres:postgres@localhost:54322/postgres  
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324

**Update Frontend**
The console will output an `anon key` which should be populated in the frontend supabase environment
`libs\environments\src\environment.ts`

**Populate DB**

```sh
yarn nx run picsa-server:supabase db reset
```

**Create User**
In order to allow communication from unauthenticated users to the database a custom anonymous user
should be created from the studio dashboard with credentials:

http://localhost:54323/project/default/auth/users

email: `anonymous_user@picsa.app`
password: `anonymous_user@picsa.app`

Ensure **Auto Confirm** is checked

## Link to server

yarn nx run picsa-server:supabase link --project-ref [ref]

## Pull server db

```sh
supabase db pull
```

## DB Migrations

```sh
yarn nx run picsa-server:supabase migration new create_monitoring_submissions
```

```

```

# Troubleshooting

**`supabase link` fails - timeout**

- Check dashboard and ensure ip not panned
- Pass password as var

```
supabase link --project-ref [ref] --password [pass]
```
