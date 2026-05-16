type FirestoreValue = {
  nullValue?: null | 'NULL_VALUE';
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number | string;
  timestampValue?: string;
  stringValue?: string;
  bytesValue?: string;
  referenceValue?: string;
  geoPointValue?: { latitude: number; longitude: number };
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

type FirestoreDocumentResponse = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

type FirestoreRunQueryResponse = {
  document?: FirestoreDocumentResponse;
  done?: boolean;
  readTime?: string;
};

export type FirebaseConfig = {
  apiKey: string;
  projectId: string;
  databaseId: string;
};

export type FirestoreDocument<T = Record<string, unknown>> = {
  id: string;
  name: string;
  path: string;
  data: T;
};

export class FirebaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirebaseConfigError';
  }
}

export function getFirebaseConfigFromEnv(): FirebaseConfig {
  const apiKey = Deno.env.get('FIREBASE_API_KEY');
  const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
  const databaseId = Deno.env.get('FIREBASE_DATABASE_ID') || '(default)';

  if (!apiKey) {
    throw new FirebaseConfigError('FIREBASE_API_KEY is required.');
  }
  if (!projectId) {
    throw new FirebaseConfigError('FIREBASE_PROJECT_ID is required.');
  }

  return { apiKey, projectId, databaseId };
}

export async function queryFirestoreCollectionWhereFieldNotNull<T = Record<string, unknown>>(
  collectionPath: string,
  fieldPath: string,
  config = getFirebaseConfigFromEnv(),
): Promise<FirestoreDocument<T>[]> {
  const { parentPath, collectionId } = parseCollectionPath(collectionPath);
  const parent = firestoreParentPath(config, parentPath);
  const url = new URL(`https://firestore.googleapis.com/v1/${parent}:runQuery`);
  url.searchParams.set('key', config.apiKey);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where: {
          unaryFilter: {
            field: { fieldPath },
            op: 'IS_NOT_NULL',
          },
        },
        orderBy: [{ field: { fieldPath }, direction: 'ASCENDING' }],
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Firestore query failed (${response.status}): ${errorBody}`);
  }

  const results = (await response.json()) as FirestoreRunQueryResponse[];
  return results.flatMap((result) => {
    if (!result.document) return [];
    return [decodeFirestoreDocument<T>(result.document)];
  });
}

function parseCollectionPath(collectionPath: string) {
  const segments = collectionPath.split('/').filter(Boolean);
  if (segments.length === 0 || segments.length % 2 === 0) {
    throw new Error(`Invalid Firestore collection path: ${collectionPath}`);
  }
  return {
    collectionId: segments[segments.length - 1],
    parentPath: segments.slice(0, -1),
  };
}

function firestoreParentPath(config: FirebaseConfig, parentPath: string[]) {
  const baseSegments = ['projects', config.projectId, 'databases', config.databaseId, 'documents'];
  return [...baseSegments, ...parentPath].map(encodeURIComponent).join('/');
}

function decodeFirestoreDocument<T>(document: FirestoreDocumentResponse): FirestoreDocument<T> {
  const path = document.name.split('/documents/')[1] || document.name;
  const id = path.split('/').at(-1) || path;
  return {
    id,
    name: document.name,
    path,
    data: decodeFirestoreFields(document.fields || {}) as T,
  };
}

function decodeFirestoreFields(fields: Record<string, FirestoreValue>) {
  const decoded: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    decoded[key] = decodeFirestoreValue(value);
  }
  return decoded;
}

function decodeFirestoreValue(value: FirestoreValue): unknown {
  if ('nullValue' in value) return null;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('stringValue' in value) return value.stringValue;
  if ('bytesValue' in value) return value.bytesValue;
  if ('referenceValue' in value) return value.referenceValue;
  if ('geoPointValue' in value) return value.geoPointValue;
  if ('arrayValue' in value) {
    return (value.arrayValue?.values || []).map((entry) => decodeFirestoreValue(entry));
  }
  if ('mapValue' in value) {
    return decodeFirestoreFields(value.mapValue?.fields || {});
  }
  return null;
}
