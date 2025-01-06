export async function setupOfflineSync() {
    if (!('serviceWorker' in navigator)) return;
  
    const registration = await navigator.serviceWorker.ready;
    
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data.type === 'SYNC_REQUIRED') {
        // Trigger your fetchTodos function
        window.dispatchEvent(new Event('sync-todos'));
      }
    });
  }
  