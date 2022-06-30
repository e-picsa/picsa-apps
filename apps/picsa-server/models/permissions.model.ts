export const ClassLevelPermissions: { [name: string]: Parse.Schema.CLP } = {
    authenticated_read_only: {
      find: {
        requiresAuthentication: true,
        'role:admin': true,
      },
      get: {
        requiresAuthentication: true,
        'role:admin': true,
      },
      create: { 'role:admin': true },
      update: { 'role:admin': true },
      delete: { 'role:admin': true },
    },
    public_read_only: {
      find: {
        '*': true,
      },
      get: {
        '*': true,
      },
      create: { 'role:admin': true },
      update: { 'role:admin': true },
      delete: { 'role:admin': true },
    },
  };