## Quickstart

```sh
cp ./docker/.env.example ./docker/.env
```

```sh
yarn nx run picsa-server:start
```

```sh
yarn nx run picsa-server:scripts db-migrate.ts
```

Dashboard will run at http://localhost:3000/

## Scripts Dev

```sh
yarn nx run picsa-server:scripts --watch db-migrate.ts
```

## Links

- https://supabase.com/docs/guides/hosting/docker
