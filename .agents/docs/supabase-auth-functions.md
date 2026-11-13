# Supabase Auth Helper Functions

This document outlines the available authentication helper functions in the Supabase database.

## Table of Contents

1. [Introduction](#introduction)
2. [Functions](#functions)
   - [user_is_admin](#user_is_admin)
   - [user_has_role](#user_has_role)
   - [user_is_global_admin](#user_is_global_admin)

## Introduction

Authentication permissions are managed via custom PostgreSQL functions that abstract complex role-checking logic. These functions can be used in Row Level Security (RLS) policies and other database functions to enforce access control.

## Functions

### `user_is_admin`

**Signature**:

```sql
user_is_admin(p_deployment_id text, p_module text DEFAULT NULL) RETURNS boolean
```

**Description**:
Checks if the current user (`auth.uid()`) has an admin role for a **specific deployment**.

- **Source**: `public.user_roles` table
- **Performance**: High (uses indexed lookup)
- **Usage**: Use when checking permissions within a specific deployment context (e.g., viewing data belonging to a deployment).

**Example**:

```sql
CREATE POLICY "Admin access" ON "some_deployment_table"
FOR ALL USING ( user_is_admin(deployment_id) );
```

---

### `user_has_role`

**Signature**:

```sql
user_has_role(p_deployment_id text, p_role app_role, p_module text DEFAULT NULL) RETURNS boolean
```

**Description**:
Checks if the current user has a specific role (or higher privilege) for a specific deployment. Handles permission inheritance (e.g., `admin` implies `editor`).

- **Source**: `public.user_roles` table
- **Usage**: Granular permission checks.

---

### `user_is_global_admin`

**Signature**:

```sql
user_is_global_admin() RETURNS boolean
```

**Description**:
Checks if the current user has the `admin` role on **ANY** deployment, by inspecting the JWT claims (`picsa_roles`).

- **Source**: JWT (`auth.jwt()`) custom claims. Does **not** query the `user_roles` table.
- **Performance**: Very High (in-memory JSON check, no disk I/O).
- **Usage**:
  - Use when a **global** admin check is required.
  - Use in RLS policies for tables that do **not** have a `deployment_id` column (e.g. `user_profiles`).
  - Prefer this over querying `user_roles` when simply checking "is this user an admin anywhere?".

**Example**:

```sql
CREATE POLICY "Admins View All" ON "public"."user_profiles"
FOR SELECT USING ( user_is_global_admin() );
```
