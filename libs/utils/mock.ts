import type { IDBDoc } from '@picsa/models/src';

export function generateMockDBMeta(doc: any = {}): IDBDoc {
  const { _key, _created, _modified } = doc;
  return {
    _key: _key ? _key : generateRandomKey(),
    _created: _created ?? new Date().toISOString(),
    _modified: _modified ?? new Date().toISOString(),
  };
}

function generateRandomKey() {
  return Math.random().toString(36).substring(2, 15);
}
