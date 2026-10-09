export * from './db.service';
export * from './db-attachment.service';
export * from './models';
export * from './schemas/attachments';

/** Generate a timestamp as standard ISO string */
export const generateTimestamp = (): string => {
  return new Date().toISOString();
};
