async function getIndexedDB(dbName: string) {
  const databases = await indexedDB.databases();

  if (!databases.find(({ name }) => name === dbName)) {
    console.warn('DB not found with name', dbName);
    return null;
  }

  return new Promise<IDBDatabase | null>((resolve) => {
    const req = indexedDB.open(dbName);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      console.warn(req.error);
      resolve(null);
    };
  });
}

export async function getIndexedDBData(indexedDBName: string, objectStoreName = 'docs') {
  const db = await getIndexedDB(indexedDBName);
  if (!db) return [];

  if (!db.objectStoreNames.contains(objectStoreName)) {
    console.warn(`[${indexedDBName}] does not contain objectStore: ${objectStoreName}`);
    return [];
  }

  // TODO - ensure objectstorenames exist

  return new Promise<any[]>((resolve) => {
    const req = db.transaction([objectStoreName], 'readwrite').objectStore(objectStoreName).getAll();
    req.onsuccess = () => resolve(req.result);
    // if db does not exist simply resolve empty docs
    req.onerror = (err) => {
      console.warn(err);
      resolve([]);
    };
  });
}

export async function removeIndexedDB(dbName: string) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(dbName);
    req.onsuccess = () => resolve(true);
    req.onerror = (err) => reject(err);
  });
}
