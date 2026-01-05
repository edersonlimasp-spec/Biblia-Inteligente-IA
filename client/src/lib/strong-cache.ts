const DB_NAME = 'biblia-inteligente-cache';
const DB_VERSION = 1;
const STORE_STRONG = 'strong-entries';
const STORE_OCCURRENCES = 'strong-occurrences';

interface CachedStrongEntry {
  number: string;
  data: unknown;
  cachedAt: number;
}

interface CachedOccurrences {
  number: string;
  data: unknown;
  cachedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_STRONG)) {
        db.createObjectStore(STORE_STRONG, { keyPath: 'number' });
      }
      if (!db.objectStoreNames.contains(STORE_OCCURRENCES)) {
        db.createObjectStore(STORE_OCCURRENCES, { keyPath: 'number' });
      }
    };
  });
  
  return dbPromise;
}

export async function getCachedStrongEntry(strongNumber: string): Promise<unknown | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_STRONG, 'readonly');
      const store = transaction.objectStore(STORE_STRONG);
      const request = store.get(strongNumber);
      
      request.onsuccess = () => {
        const result = request.result as CachedStrongEntry | undefined;
        if (result) {
          const oneDayMs = 24 * 60 * 60 * 1000;
          if (Date.now() - result.cachedAt < oneDayMs * 7) {
            resolve(result.data);
            return;
          }
        }
        resolve(null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function cacheStrongEntry(strongNumber: string, data: unknown): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_STRONG, 'readwrite');
    const store = transaction.objectStore(STORE_STRONG);
    
    const entry: CachedStrongEntry = {
      number: strongNumber,
      data,
      cachedAt: Date.now(),
    };
    
    store.put(entry);
  } catch (error) {
    console.warn('Failed to cache Strong entry:', error);
  }
}

export async function getCachedOccurrences(strongNumber: string): Promise<unknown | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_OCCURRENCES, 'readonly');
      const store = transaction.objectStore(STORE_OCCURRENCES);
      const request = store.get(strongNumber);
      
      request.onsuccess = () => {
        const result = request.result as CachedOccurrences | undefined;
        if (result) {
          const oneDayMs = 24 * 60 * 60 * 1000;
          if (Date.now() - result.cachedAt < oneDayMs * 7) {
            resolve(result.data);
            return;
          }
        }
        resolve(null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function cacheOccurrences(strongNumber: string, data: unknown): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_OCCURRENCES, 'readwrite');
    const store = transaction.objectStore(STORE_OCCURRENCES);
    
    const entry: CachedOccurrences = {
      number: strongNumber,
      data,
      cachedAt: Date.now(),
    };
    
    store.put(entry);
  } catch (error) {
    console.warn('Failed to cache occurrences:', error);
  }
}

export async function getCacheStats(): Promise<{ strongEntries: number; occurrences: number }> {
  try {
    const db = await openDB();
    
    const countStore = (storeName: string): Promise<number> => {
      return new Promise((resolve) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
    };
    
    const [strongEntries, occurrences] = await Promise.all([
      countStore(STORE_STRONG),
      countStore(STORE_OCCURRENCES),
    ]);
    
    return { strongEntries, occurrences };
  } catch {
    return { strongEntries: 0, occurrences: 0 };
  }
}

export async function clearCache(): Promise<void> {
  try {
    const db = await openDB();
    
    const clearStore = (storeName: string): Promise<void> => {
      return new Promise((resolve) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    };
    
    await Promise.all([
      clearStore(STORE_STRONG),
      clearStore(STORE_OCCURRENCES),
    ]);
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}
