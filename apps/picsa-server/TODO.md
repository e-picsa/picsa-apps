**Features**

**Misc**

- Update legacy docs

- Drop additional kobo_sync columns no longer used (not permanent store of kobo metadata)

- Consider calling proxy directly from app (essentially two separate sync protocols)

- Handle submit of forms created on different profile/app language

**Documentation**

- functions KOBO_API_KEY
- Different endpoints (kpi default however can't create submissions and can only bulk edit, so use more kc submissions). E.g. docs https://kf.kobotoolbox.org/api/v2/assets/aLgKwDoHNd38sZyBQMV293/data/ and https://kc.kobotoolbox.org/api/v1/data
  Submissions api only for submitting new entries, need to separately use v1 data api or v2 data api to remove data

- Export insomnia workspaces
