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

/**
 * How long to stop attempting live CMA scrapes after the site blocks us.
 *
 * When car.cma.gov.il's WAF rejects the automated session, every further attempt
 * burns the full ~55s budget before failing the same way. Without this, an agent
 * clicking Re-price three times waits ~3 minutes to be told "blocked" three times.
 */
const BLOCK_BACKOFF_MS = 15 * 60 * 1000;

export interface CachedLiveComparison {
  comparison: LiveHovaComparison;
  fetchedAt: string;
}

interface CacheFile {
  /** Cached comparisons, keyed by lead id. */
  leads: Record<string, CachedLiveComparison>;
  /** ISO timestamp of the last time CMA blocked an automated attempt. */
  cmaBlockedAt?: string;
}

const EMPTY_CACHE: CacheFile = { leads: {} };

let writeQueue: Promise<void> = Promise.resolve();

const readCache = async (): Promise<CacheFile> => {
  try {
    const raw = await fs.readFile(CACHE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    // Tolerate the pre-block-tracking shape (a flat map of lead id -> entry).
    if (parsed && typeof parsed === 'object' && !('leads' in parsed)) {
      return { leads: parsed };
    }
    return { leads: {}, ...parsed };
  } catch (error: any) {
    if (error?.code === 'ENOENT') return { ...EMPTY_CACHE };
    console.warn('Failed to read live hova cache, starting empty:', error);
    return { ...EMPTY_CACHE };
  }
};

/** Serializes writes so concurrent Re-price clicks can't interleave and corrupt the file. */
const mutate = (fn: (cache: CacheFile) => void): Promise<void> => {
  writeQueue = writeQueue
    .then(async () => {
      const cache = await readCache();
      fn(cache);
      await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
      await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
    })
    .catch((error) => {
      console.warn('Failed to write live hova cache:', error);
    });
  return writeQueue;
};

/** Reads the cached live comparison for one lead, if any was ever fetched. */
export const getCachedLiveComparison = async (leadId: string): Promise<CachedLiveComparison | undefined> => {
  const cache = await readCache();
  return cache.leads[leadId];
};

/** Reads cached live comparisons for a set of leads in one file read. */
export const getCachedLiveComparisons = async (leadIds: string[]): Promise<Record<string, CachedLiveComparison>> => {
  const cache = await readCache();
  const result: Record<string, CachedLiveComparison> = {};
  for (const id of leadIds) {
    if (cache.leads[id]) result[id] = cache.leads[id];
  }
  return result;
};

/** Saves a fresh live comparison, and clears any standing block (the site let us through). */
export const saveLiveComparison = (leadId: string, comparison: LiveHovaComparison): Promise<void> =>
  mutate((cache) => {
    cache.leads[leadId] = { comparison, fetchedAt: new Date().toISOString() };
    if (comparison.cma.status === 'ok') delete cache.cmaBlockedAt;
  });

/** Records that CMA blocked an automated attempt, starting the back-off window. */
export const markCmaBlocked = (): Promise<void> =>
  mutate((cache) => {
    cache.cmaBlockedAt = new Date().toISOString();
  });

/**
 * Minutes remaining in the back-off window, or 0 when a live attempt is worth making.
 * Callers should skip the scrape (and fall back to the local engine) when this is > 0.
 */
export const cmaBlockCooldownMinutes = async (): Promise<number> => {
  const cache = await readCache();
  if (!cache.cmaBlockedAt) return 0;

  const elapsed = Date.now() - new Date(cache.cmaBlockedAt).getTime();
  if (!Number.isFinite(elapsed) || elapsed >= BLOCK_BACKOFF_MS) return 0;
  return Math.ceil((BLOCK_BACKOFF_MS - elapsed) / 60000);
};

/** Drops the cached entry for a lead — used when a lead is deleted or converted. */
export const clearCachedLiveComparison = (leadId: string): Promise<void> =>
  mutate((cache) => {
    delete cache.leads[leadId];
  });
