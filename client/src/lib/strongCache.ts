// IndexedDB-based cache for Strong's Dictionary entries
// Provides instant offline access and reduces network requests

const DB_NAME = 'BibliaInteligenteStrong';
const DB_VERSION = 1;
const STORE_SUMMARY = 'strongSummaries';
const STORE_DETAIL = 'strongDetails';

interface StrongSummary {
  number: string;
  word: string;
  transliteration: string;
  language: string;
  shortDefinition: string;
  cachedAt: number;
}

interface StrongDetail {
  number: string;
  word: string;
  transliteration: string;
  pronunciation: string;
  definition: string;
  portugueseDefinition: string | null;
  strongsDefinition: string | null;
  kjvDefinition: string | null;
  derivation: string | null;
  extendedDefinition: string | null;
  language: string;
  cachedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('[StrongCache] Failed to open IndexedDB:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_SUMMARY)) {
        db.createObjectStore(STORE_SUMMARY, { keyPath: 'number' });
      }
      
      if (!db.objectStoreNames.contains(STORE_DETAIL)) {
        db.createObjectStore(STORE_DETAIL, { keyPath: 'number' });
      }
    };
  });
  
  return dbPromise;
}

// Get summary from IndexedDB cache
export async function getCachedSummary(strongNumber: string): Promise<StrongSummary | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SUMMARY, 'readonly');
      const store = tx.objectStore(STORE_SUMMARY);
      const request = store.get(strongNumber.toUpperCase());
      
      request.onsuccess = () => {
        const entry = request.result as StrongSummary | undefined;
        // Cache valid for 7 days
        if (entry && Date.now() - entry.cachedAt < 7 * 24 * 60 * 60 * 1000) {
          resolve(entry);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Get detail from IndexedDB cache
export async function getCachedDetail(strongNumber: string): Promise<StrongDetail | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_DETAIL, 'readonly');
      const store = tx.objectStore(STORE_DETAIL);
      const request = store.get(strongNumber.toUpperCase());
      
      request.onsuccess = () => {
        const entry = request.result as StrongDetail | undefined;
        // Cache valid for 7 days
        if (entry && Date.now() - entry.cachedAt < 7 * 24 * 60 * 60 * 1000) {
          resolve(entry);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Save summary to IndexedDB cache
export async function cacheSummary(summary: Omit<StrongSummary, 'cachedAt'>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SUMMARY, 'readwrite');
    const store = tx.objectStore(STORE_SUMMARY);
    
    const entry: StrongSummary = {
      ...summary,
      number: summary.number.toUpperCase(),
      cachedAt: Date.now(),
    };
    
    store.put(entry);
  } catch (error) {
    console.error('[StrongCache] Failed to cache summary:', error);
  }
}

// Save detail to IndexedDB cache
export async function cacheDetail(detail: Omit<StrongDetail, 'cachedAt'>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DETAIL, 'readwrite');
    const store = tx.objectStore(STORE_DETAIL);
    
    const entry: StrongDetail = {
      ...detail,
      number: detail.number.toUpperCase(),
      cachedAt: Date.now(),
    };
    
    store.put(entry);
  } catch (error) {
    console.error('[StrongCache] Failed to cache detail:', error);
  }
}

// Batch cache summaries
export async function cacheSummaries(summaries: Record<string, Omit<StrongSummary, 'cachedAt'>>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SUMMARY, 'readwrite');
    const store = tx.objectStore(STORE_SUMMARY);
    
    for (const [num, summary] of Object.entries(summaries)) {
      const entry: StrongSummary = {
        ...summary,
        number: num.toUpperCase(),
        cachedAt: Date.now(),
      };
      store.put(entry);
    }
  } catch (error) {
    console.error('[StrongCache] Failed to batch cache summaries:', error);
  }
}

// Get multiple summaries from cache
export async function getCachedSummaries(strongNumbers: string[]): Promise<Record<string, StrongSummary>> {
  const result: Record<string, StrongSummary> = {};
  
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SUMMARY, 'readonly');
    const store = tx.objectStore(STORE_SUMMARY);
    
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    
    await Promise.all(
      strongNumbers.map((num) => new Promise<void>((resolve) => {
        const request = store.get(num.toUpperCase());
        request.onsuccess = () => {
          const entry = request.result as StrongSummary | undefined;
          if (entry && now - entry.cachedAt < maxAge) {
            result[entry.number] = entry;
          }
          resolve();
        };
        request.onerror = () => resolve();
      }))
    );
  } catch {
    // Ignore errors
  }
  
  return result;
}

// Performance telemetry
export interface StrongPerfMetrics {
  t0_click: number;
  t1_modalOpen?: number;
  t2_requestStart?: number;
  t3_firstByte?: number;
  t4_jsonParse?: number;
  t5_renderComplete?: number;
  cacheHit: boolean;
  payloadSize?: number;
  userAgent: string;
  platform: string;
}

export function createPerfTracker(): StrongPerfMetrics {
  const ua = navigator.userAgent;
  let platform = 'web';
  
  if (/iPad|iPhone|iPod/.test(ua)) {
    platform = (navigator as any).standalone ? 'ios-pwa' : 'ios-safari';
  } else if (/Android/.test(ua)) {
    platform = window.matchMedia('(display-mode: standalone)').matches ? 'android-pwa' : 'android-chrome';
  }
  
  return {
    t0_click: performance.now(),
    cacheHit: false,
    userAgent: ua,
    platform,
  };
}

export function logPerfMetrics(metrics: StrongPerfMetrics): void {
  const totalTime = (metrics.t5_renderComplete || performance.now()) - metrics.t0_click;
  console.log(`[Strong Perf] Total: ${totalTime.toFixed(0)}ms, Cache: ${metrics.cacheHit ? 'HIT' : 'MISS'}, Platform: ${metrics.platform}`);
}
