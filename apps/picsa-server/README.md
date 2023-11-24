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

```sh
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

In order to run tests that connect to supabase an additional `.env.local` file should be populated in the the functions directory with SUPABASE_ANON_KEY credentials

Tests are written using the [Behavior-Driven Development](https://docs.deno.com/runtime/manual/basics/testing/behavior_driven_development) module

Functions cli supports [additional arguments](https://fig.io/manual/deno/test) such as `--watch`

```sh
yarn nx run picsa-server:test-functions --watch
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

**Relative import path "@supabase/supabase-js" not prefixed**
Any Imports have to be defined both in `import-map.json` file

**Ports are not available: exposing port TCP 0.0.0.0:54322 -> 0.0.0.0:0: listen tcp 0.0.0.0:54322: bind: An attempt was made to access a socket in a way forbidden by its access permissions**
Windows reserves some of the same ports that supabase uses. Either the supabase ports can be modified from the `config.toml` file, or windows updated to change restricted port ranges

https://stackoverflow.com/a/71190107/5693245
https://github.com/supabase/cli/issues/189

# Links

- https://supabase.com/blog/supabase-local-dev
- https://supabase.github.io/pg_graphql/computed_fields/
