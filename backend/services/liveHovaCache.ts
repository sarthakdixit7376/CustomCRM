/**
 * Cache for live CMA hova comparisons (`liveHovaComparison.ts`).
 *
 * A live comparison launches real headless Chrome against car.cma.gov.il and can
 * take up to ~60s. Without a cache, every page load that wants to *show* the last
 * result an agent already fetched would have to re-run that whole scrape just to
 * redisplay it. This persists the result to disk (not Postgres — the schema is
 * mid-migration and blocked on a pending git merge, see LeadModel.ts) so it survives
 * a page refresh or server restart, keyed by lead id.
 *
 * Deliberately a flat JSON file, matching the existing `data/leads.json` /
 * `data/fields.json` pattern in this backend rather than introducing a new storage
 * layer for what is, functionally, a cache.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { LiveHovaComparison } from './liveHovaComparison.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = path.join(__dirname, '../data/liveHovaCache.json');

export interface CachedLiveComparison {
  comparison: LiveHovaComparison;
  fetchedAt: string;
}

type CacheFile = Record<string, CachedLiveComparison>;

let writeQueue: Promise<void> = Promise.resolve();

const readCache = async (): Promise<CacheFile> => {
  try {
    const raw = await fs.readFile(CACHE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (error: any) {
    if (error?.code === 'ENOENT') return {};
    console.warn('Failed to read live hova cache, starting empty:', error);
    return {};
  }
};

/** Reads the cached live comparison for one lead, if any was ever fetched. */
export const getCachedLiveComparison = async (leadId: string): Promise<CachedLiveComparison | undefined> => {
  const cache = await readCache();
  return cache[leadId];
};

/** Reads cached live comparisons for a set of leads in one file read. */
export const getCachedLiveComparisons = async (leadIds: string[]): Promise<Record<string, CachedLiveComparison>> => {
  const cache = await readCache();
  const result: Record<string, CachedLiveComparison> = {};
  for (const id of leadIds) {
    if (cache[id]) result[id] = cache[id];
  }
  return result;
};

/**
 * Saves a fresh live comparison. Writes are serialized through a queue so two
 * concurrent Re-price clicks can't interleave and corrupt the file.
 */
export const saveLiveComparison = (leadId: string, comparison: LiveHovaComparison): Promise<void> => {
  writeQueue = writeQueue
    .then(async () => {
      const cache = await readCache();
      cache[leadId] = { comparison, fetchedAt: new Date().toISOString() };
      await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
      await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
    })
    .catch((error) => {
      console.warn('Failed to save live hova cache:', error);
    });
  return writeQueue;
};

/** Drops the cached entry for a lead — used when a lead is deleted or converted. */
export const clearCachedLiveComparison = (leadId: string): Promise<void> => {
  writeQueue = writeQueue
    .then(async () => {
      const cache = await readCache();
      if (leadId in cache) {
        delete cache[leadId];
        await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
        await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
      }
    })
    .catch((error) => {
      console.warn('Failed to clear live hova cache entry:', error);
    });
  return writeQueue;
};
