const DB_NAME = 'NextStackDB';
const STORE_NAME = 'appData';
const DB_VERSION = 1;

export async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveDataOffline(data: any[]) {
  const db = await initDB();
  const tx = (db as IDBDatabase).transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  await Promise.all(data.map(item => store.put(item)));
  return new Promise(resolve => tx.oncomplete = resolve);
}

export async function getOfflineData() {
  const db = await initDB();
  const tx = (db as IDBDatabase).transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  return store.getAll();
}