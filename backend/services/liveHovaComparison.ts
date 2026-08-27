/**
 * Live mandatory (hova) quotes from the official CMA calculator.
 *
 *   car.cma.gov.il — regulated tariff comparison across insurers
 *
 * Makif / tzad-gimel stay on the local pricing engine.
 */

import puppeteer, { type Browser } from 'puppeteer';
import { buildQuoteProfile, type QuoteProfileInput } from './pricingEngine.js';

const CMA_URL = 'https://car.cma.gov.il/';
const CMA_TIMEOUT_MS = 45_000;

export interface LiveInsurerQuote {
  insurer: string;
  annualPrice: number | null;
  serviceScore?: string;
  note?: string;
}

export interface LiveSourceResult {
  source: 'cma';
  status: 'ok' | 'error' | 'skipped';
  error?: string;
  quotes: LiveInsurerQuote[];
  cheapest?: LiveInsurerQuote;
  poolPrice?: number;
  url: string;
  fetchedAt: string;
}

export interface LiveHovaComparison {
  cma: LiveSourceResult;
  /** Cheapest usable annual hova premium from CMA. */
  recommendedMandatoryPrice?: number;
}

export interface LiveQuoteLeadInput extends QuoteProfileInput {
  sugDelekNm?: string | null;
  gender?: 'male' | 'female' | null;
  accidentsLast3Years?: number | null;
  licenseSuspensionsLast3Years?: number | null;
}

const chromeExecutable = (): string | undefined => {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  // Local macOS: prefer the installed Chrome when the Puppeteer cache is missing.
  if (process.platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }
  return undefined;
};

const launchBrowser = async (): Promise<Browser> => {
  const executablePath = chromeExecutable();
  return puppeteer.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--lang=he-IL',
    ],
  });
};

/** Maps gov fuel text onto CMA's `parameters[N]` select values. */
const fuelCode = (sugDelekNm?: string | null): string => {
  const t = (sugDelekNm || '').toLowerCase();
  if (/חשמל|electric/.test(t) && /בנזין|petrol|gasoline/.test(t)) return '3';
  if (/חשמל|electric/.test(t)) return '6';
  if (/דיזל|diesel/.test(t)) return '5';
  if (/גז|gas|lpg/.test(t) && /בנזין/.test(t)) return '2';
  if (/גז|gas|lpg/.test(t)) return '4';
  return '1'; // בנזין
};

const sheetId = (sugRechevNm?: string | null): string => {
  const t = sugRechevNm || '';
  if (/אופנוע|קטנוע/.test(t)) return '2';
  if (/אוטובוס|טיולית/.test(t)) return '3';
  if (/מונית/.test(t)) return '4';
  if (/מסחרי/.test(t)) return '5';
  if (/מיוחד/.test(t)) return '7';
  return '1';
};

const ownershipCode = (baalut?: string | null): string =>
  /פרטי/.test(baalut || '') ? '1001' : baalut ? '1002' : '1001';

/**
 * Infer ABS / ESP / airbags / FCW / LDW from the gov safety-equipment level when
 * we don't have those flags as discrete fields. Higher levels assume more kit.
 */
const safetyFlags = (safetyLevel: number) => ({
  abs: safetyLevel >= 2 ? '1' : '2',
  esp: safetyLevel >= 3 ? '1' : '2',
  airbags: String(Math.min(8, Math.max(0, safetyLevel >= 1 ? Math.max(2, Math.round(safetyLevel)) : 0))),
  fcw: safetyLevel >= 6 ? '1' : '2',
  ldw: safetyLevel >= 6 ? '1' : '2',
});

/** Insurance start date as DD/MM/YYYY — prefer the 1st of next month (common renewal). */
const defaultInsuranceDate = (): string => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const pickCheapest = (quotes: LiveInsurerQuote[]): LiveInsurerQuote | undefined => {
  const priced = quotes.filter((q) => q.annualPrice != null) as Array<LiveInsurerQuote & { annualPrice: number }>;
  if (priced.length === 0) return undefined;
  return priced.reduce((best, q) => (q.annualPrice < best.annualPrice ? q : best));
};

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Official CMA hova tariff table for the lead's driver + vehicle profile. */
export async function fetchCmaHovaQuotes(
  lead: LiveQuoteLeadInput,
  browser?: Browser
): Promise<LiveSourceResult> {
  const fetchedAt = new Date().toISOString();
  const profile = buildQuoteProfile(lead);
  const flags = safetyFlags(profile.safetyLevel);
  const gender = lead.gender === 'female' ? '2' : '1';
  const accidentCount = lead.accidentsLast3Years ?? 0;

  let ownedBrowser: Browser | undefined;
  try {
    const b = browser ?? (ownedBrowser = await launchBrowser());
    const page = await b.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.goto(CMA_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForSelector('#myForm', { timeout: 15_000 });

    await page.select('#ddlSheets', sheetId(lead.sugRechevNm));
    // Sheet change reloads parameters via AJAX — wait a beat for private-car defaults.
    await new Promise((r) => setTimeout(r, 800));
    await page.select('#code_owner', ownershipCode(lead.baalut));

    await page.evaluate(`(() => {
      const el = document.getElementById('insurance_date');
      if (el) {
        el.value = ${JSON.stringify(defaultInsuranceDate())};
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);

    const setValue = async (selector: string, value: string) => {
      await page.evaluate(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return;
        el.value = ${JSON.stringify(value)};
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);
    };

    // Gender radios share a duplicated id — select by name + value.
    await page.evaluate(`(() => {
      const radio = document.querySelector('input[name="parameters[0].value"][value="${gender}"]');
      if (radio) radio.click();
    })()`);

    await setValue('#D2', String(profile.driverAge));
    await setValue('#E', String(profile.licenseYears));
    await setValue('#F', String(accidentCount));
    await setValue('#G', String(lead.licenseSuspensionsLast3Years ?? 0));
    await setValue('#N', fuelCode(lead.sugDelekNm));
    await setValue('#A', String(profile.engineCc));
    await setValue('#O', String(profile.horsePower));

    await page.evaluate(`(() => {
      const clickRadio = function (name, value) {
        const el = document.querySelector('input[name="' + name + '"][value="' + value + '"]');
        if (el) el.click();
      };
      clickRadio('parameters[8].value', ${JSON.stringify(flags.abs)});
      clickRadio('parameters[9].value', ${JSON.stringify(flags.esp)});
      const air = document.getElementById('H');
      if (air) {
        air.value = ${JSON.stringify(flags.airbags)};
        air.dispatchEvent(new Event('change', { bubbles: true }));
      }
      clickRadio('parameters[11].value', ${JSON.stringify(flags.fcw)});
      clickRadio('parameters[12].value', ${JSON.stringify(flags.ldw)});
      const usage = document.getElementById('B');
      if (usage) usage.value = '6';
    })()`);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => null),
      page.evaluate(`(() => {
        const btn = document.getElementById('press_to_compare');
        if (btn) btn.click();
      })()`),
    ]);

    await page.waitForSelector('#ResultTable', { timeout: 20_000 });

    const parsed = await page.evaluate(`(() => {
      const parsePriceLocal = function (raw) {
        const cleaned = raw.replace(/[^\\d]/g, '');
        if (!cleaned) return null;
        const n = Number(cleaned);
        return Number.isFinite(n) && n > 0 ? n : null;
      };

      const body = (document.body && document.body.innerText) || '';
      // Pool premium is a comma-formatted shekel amount near "הפול", not the service-score digit.
      const poolMatch = body.match(/הפול[^\\n\\r]{0,80}?([\\d]{1,3},[\\d]{3})/);
      const poolPrice = poolMatch ? parsePriceLocal(poolMatch[1]) : undefined;

      const quotes = [];
      const rows = Array.from(document.querySelectorAll('#ResultTable tr')).slice(1);
      for (const tr of rows) {
        const cells = Array.from(tr.children).map(function (td) {
          return (td.textContent || '').trim().replace(/\\s+/g, ' ');
        });
        const insurer = cells.find(function (c) {
          return /ביטוח|בע"מ|אגודה|פול/.test(c) && !/סמל|חברת/.test(c);
        });
        const priceCell = cells.find(function (c) {
          return /^\\d{1,3}(,\\d{3})+$/.test(c) || /^\\d{3,5}$/.test(c);
        });
        const noteCell = cells.find(function (c) {
          return /אינה מוכרת|זהה לפול|\\*/.test(c);
        });
        if (!insurer) continue;
        if (/^\\*$|החברה בדרך כלל/.test(insurer)) continue;
        const annualPrice = priceCell ? parsePriceLocal(priceCell) : null;
        const serviceScore = cells.find(function (c) {
          return /^\\d{2,3}$/.test(c) || c === '**';
        });
        quotes.push({
          insurer: insurer,
          annualPrice: annualPrice,
          serviceScore: serviceScore,
          note: noteCell && !priceCell
            ? noteCell
            : annualPrice == null
              ? noteCell || cells.find(function (c) { return /אינה מוכרת|זהה/.test(c); })
              : undefined,
        });
      }

      return { quotes: quotes, poolPrice: poolPrice || undefined };
    })()`) as {
      quotes: LiveInsurerQuote[];
      poolPrice?: number;
    };

    await page.close();

    const quotes = parsed.quotes.filter((q) => q.insurer);
    const cheapest = pickCheapest(quotes);
    return {
      source: 'cma',
      status: quotes.length > 0 ? 'ok' : 'error',
      error: quotes.length > 0 ? undefined : 'CMA returned no insurer rows',
      quotes,
      cheapest,
      poolPrice: parsed.poolPrice,
      url: CMA_URL,
      fetchedAt,
    };
  } catch (error: any) {
    return {
      source: 'cma',
      status: 'error',
      error: error?.message || String(error),
      quotes: [],
      url: CMA_URL,
      fetchedAt,
    };
  } finally {
    if (ownedBrowser) await ownedBrowser.close().catch(() => undefined);
  }
}

/** Fetches live CMA hova quotes and returns the cheapest recommended premium. */
export async function compareLiveHova(lead: LiveQuoteLeadInput): Promise<LiveHovaComparison> {
  const cma = await withTimeout(
    fetchCmaHovaQuotes(lead),
    CMA_TIMEOUT_MS,
    'CMA'
  ).catch(
    (error: any): LiveSourceResult => ({
      source: 'cma',
      status: 'error',
      error: error?.message || String(error),
      quotes: [],
      url: CMA_URL,
      fetchedAt: new Date().toISOString(),
    })
  );

  return {
    cma,
    recommendedMandatoryPrice: cma.cheapest?.annualPrice ?? undefined,
  };
}
