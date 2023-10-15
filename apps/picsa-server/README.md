# PICSA Server

See docs at: https://docs.picsa.app/advanced/server/setup

## Prerequisites

- Docker Desktop
- [Deno](https://docs.deno.com/runtime/manual/getting_started/installation)
- [Deno VSCode Extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno)

## Quickstart

### Start Server

```sh
yarn nx run picsa-server:supabase start
```

This will start various backend services within docker containers

API URL: http://localhost:54321
GraphQL URL: http://localhost:54321/graphql/v1
DB URL: postgresql://postgres:postgres@localhost:54322/postgres  
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324

Update Frontend
The console will output an `anon key` which should be populated in the frontend supabase environment
`libs\environments\src\environment.ts`

### Populate DB

```sh
yarn nx run picsa-server:supabase db reset
```

### Create User

In order to allow communication from unauthenticated users to the database a custom anonymous user
should be created from the studio dashboard with credentials:

http://localhost:54323/project/default/auth/users

email: `anonymous_user@picsa.app`
password: `anonymous_user@picsa.app`

Ensure **Auto Confirm** is checked

### Serve Functions

If developing functions locally run via

```
yarn nx run picsa-server:supabase functions serve
```

Functions can be called from any rest client.

Authorization credentials should be provided using the service_role key output when server started or by calling `nx run picsa-server:supabase status`

https://supabase.com/docs/guides/functions/local-development

**Test Functions**

Whilst serving functions tests can be executed by

```sh
yarn nx run picsa-server:test-functions
```

## Advanced Usage

## Export DB Type Generation

```sh
yarn nx run picsa-server:gen-types
```

or from the console http://localhost:54323/project/default/api?page=tables-intro

https://supabase.com/docs/guides/api/rest/generating-types

### Link to server

```
yarn nx run picsa-server:supabase link --project-ref [ref]
```

### Pull server db

```sh
supabase db pull
```

### DB Migrations

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

# Links

- https://supabase.com/blog/supabase-local-dev
- https://supabase.github.io/pg_graphql/computed_fields/
