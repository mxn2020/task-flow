const DB_NAME = 'TaskFlowDB';
const STORE_NAME = 'todos';
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

export async function saveTodosOffline(todos: any[]) {
  const db = await initDB();
  const tx = (db as IDBDatabase).transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  await Promise.all(todos.map(todo => store.put(todo)));
  return new Promise(resolve => tx.oncomplete = resolve);
}

export async function getOfflineTodos() {
  const db = await initDB();
  const tx = (db as IDBDatabase).transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  return store.getAll();
}