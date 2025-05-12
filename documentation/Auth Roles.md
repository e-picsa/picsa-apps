## TODO

- [x] DB types and table to support auth roles
- [x] DB function to assign user JWT token based on auth roles
- [x] UI directive to limit access dependent on roles
- [x] Dashboard pages to view current user role
- [x] Deployment default role settings

- [ ] Update all existing UI to restrict features as required
- [ ] Update seed scripts to include means to assign roles to demo users
- [ ] Subscribe to user_role updates (for logged in user) and refresh token on change
      https://lasse-skaalum.medium.com/implementing-rbac-with-next-js-and-supabase-5dd20adaaeba
- [ ] Dashboard pages to update user roles
- [ ] Super-admin priviledges for setting user roles
- [ ] Enable hook once deployed to production
- [ ] Add created_by to all tables to allow users to edit own content
- [ ] Migrate to docs repo

# Auth Roles

The app uses a role-based access control (RBAC) to limit what users can access.

Roles are specified on a per-feature basis, and include

[0] Viewer - Can view
[1] Author - Can create and edit their own content
[2] Admin - Can create and edit all content

When combined with a feature the user role may be spefied as:

```json
{
  "resources": "author",
  "monitoring": "admin"
}
```

## Deployment Roles

Roles are defined separately for each deployment registered in the app, and stored in the `user_roles` table
E.g.

```json
"deployment_id": "mw_farmer"
"user_id": "user_123"
"roles": {
    "resources": "author",
    "climate":"editor"
}
```

```json
"deployment_id": "mw_extension"
"user_id": "user_123"
"roles": {
    "resources": "author",
}
```

## Advanced Roles

Some features will be default viewable by everyone, others will be only viewable if explicit permissions granted

More fine-grained controls are also available at feature level if required

```json
{
  "climate__feature_flag": "viewer"
}
```

## Auth Integration

The `user_roles` table is integrated into the existing auth system by providing a JWT token custom `picsa_roles` claim populated when a user logs in. This can be read by either frontend or backend to see what roles a user has

```json
{
  "email": "admin@picsa.app",
  "picsa_roles": {
    "mw_extension": {
      "resources": "admin"
    }
  }
}
```

## Backend Permissions

When a user logs in their available roles

There is currently no permissions system that explicitly restricts operations based on user role, as there is not always a consistent means to determine which deployment is being targetted with an operation.

E.g. If a user with resources admin priviledge for one deployment is attempting to make the resource available to another (change the array of target deployment ids in the resource row), it is not easy to confirm the user has all the necessary roles for all deployments being changed (which may be one or more from the resource row)

Further work to simplify the system is proposed for the future. This will likely require separate databases per deployment and limit the extend to which content can be shared across multiple deployments.

Until then backend operations will be dictated more by what UI is displayed to trigger those actions.

## Frontend Access

When a user logs in their

## Future Tasks

- Implement role-permission mapping to specific db table CRUD operations.

## Further Reading

- https://supabase.com/docs/guides/auth/custom-claims-and-role-based-access-control-rbac
  Supabase RBAC example existing implementation based on

- https://www.postgresql.org/docs/9.3/functions-json.html
  Example postgres utilities used as part of custom token hook code

- https://github.com/supabase-community/supabase-custom-claims
  Alternate implementation to use custom-claims on auth property instead of `custom_access_token_hook`
  example in: https://dev.to/akkilah/how-to-implement-role-based-access-with-supabase-3a2

- https://casl.js.org/v6/en/
  Javascript authorization library. Not currently used but considered for future use

- https://www.npmjs.com/package/plv8ts
  Library if considering rewriting functions in typescript and converting to plv8ts
  Discussed in https://github.com/orgs/supabase/discussions/11146
