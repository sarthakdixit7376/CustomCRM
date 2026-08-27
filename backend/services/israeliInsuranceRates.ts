/**
 * Israeli motor-insurance rating tables.
 *
 * The structure of this file follows the "israeli-insurance-comparator" skill
 * (https://agentskills.co.il/en/skills/tax-and-finance/israeli-insurance-comparator),
 * which describes how the three Israeli motor products are actually priced:
 *
 *  - Bituach Hova (ביטוח חובה)      — mandatory bodily-injury cover. Priced off a
 *    REGULATED tariff: the premium is set by the driver/vehicle risk band, and
 *    insurers may only add a small permitted loading/discount on top. Because it is
 *    committee-priced rather than shopped, it can be reproduced from a rate table.
 *  - Bituach Tzad Gimel (ביטוח צד ג׳) — third-party property. Market priced.
 *  - Bituach Makif / complimentary   — own-damage cover. Market priced off the
 *    vehicle's market value.
 *
 * Every number below is a TUNABLE agency rate — edit this file (not the engine) to
 * re-price the book. Multipliers compound; each one is surfaced in the quote
 * breakdown so an agent can see exactly why a lead was priced the way it was.
 */

/** Rounds to the nearest ₪10, the granularity Israeli insurers actually quote at. */
export const roundShekel = (n: number): number => Math.round(n / 10) * 10;

/** Picks the first band whose `max` the value falls at or under. */
export interface Band<T = number> {
  max: number;
  value: T;
  label: string;
}

export const pickBand = <T>(bands: Band<T>[], value: number): Band<T> =>
  bands.find((b) => value <= b.max) ?? bands[bands.length - 1];

// ─────────────────────────────────────────────────────────────────────────────
// Driver risk
// ─────────────────────────────────────────────────────────────────────────────

/** Age of the youngest regular driver — the single biggest hova/tzad-gimel factor. */
export const AGE_BANDS: Band[] = [
  { max: 20, value: 2.40, label: 'Driver under 21' },
  { max: 23, value: 1.90, label: 'Driver 21–23' },
  { max: 25, value: 1.45, label: 'Driver 24–25' },
  { max: 30, value: 1.15, label: 'Driver 26–30' },
  { max: 64, value: 1.00, label: 'Driver 31–64' },
  { max: 74, value: 1.10, label: 'Driver 65–74' },
  { max: 200, value: 1.30, label: 'Driver 75+' },
];

/** License seniority (ותק רישיון) in years. */
export const LICENSE_SENIORITY_BANDS: Band[] = [
  { max: 0, value: 1.35, label: 'License under 1 year' },
  { max: 2, value: 1.20, label: 'License 1–2 years' },
  { max: 5, value: 1.05, label: 'License 3–5 years' },
  { max: 200, value: 1.00, label: 'License over 5 years' },
];

/**
 * Claim-free years (שנים ללא תביעות / "shin-nun"). The skill flags this as the
 * discount agents most often forget to verify, so it is a first-class input.
 */
export const CLAIM_FREE_BANDS: Band[] = [
  { max: 0, value: 1.15, label: 'Claim in the last year' },
  { max: 2, value: 1.00, label: '1–2 claim-free years' },
  { max: 4, value: 0.93, label: '3–4 claim-free years' },
  { max: 200, value: 0.85, label: '5+ claim-free years' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Vehicle risk
// ─────────────────────────────────────────────────────────────────────────────

/** Engine displacement in cc (נפח מנוע). */
export const ENGINE_CC_BANDS: Band[] = [
  { max: 1300, value: 0.92, label: 'Engine up to 1300cc' },
  { max: 1600, value: 1.00, label: 'Engine 1301–1600cc' },
  { max: 2000, value: 1.10, label: 'Engine 1601–2000cc' },
  { max: 2500, value: 1.22, label: 'Engine 2001–2500cc' },
  { max: 100000, value: 1.35, label: 'Engine over 2500cc' },
];

/** Safety-equipment level 0–8 (רמת אבזור בטיחותי) — higher is safer and cheaper. */
export const SAFETY_LEVEL_BANDS: Band[] = [
  { max: 2, value: 1.10, label: 'Safety level 0–2' },
  { max: 4, value: 1.03, label: 'Safety level 3–4' },
  { max: 6, value: 1.00, label: 'Safety level 5–6' },
  { max: 8, value: 0.94, label: 'Safety level 7–8' },
];

/** Vehicle type, matched against the gov registry's `sug_rechev_nm` text. */
export const VEHICLE_TYPE_LOADINGS: { match: RegExp; value: number; label: string }[] = [
  { match: /אופנוע|קטנוע/, value: 1.85, label: 'Motorcycle' },
  { match: /מסחרי/, value: 1.25, label: 'Commercial vehicle' },
  { match: /משא/, value: 1.40, label: 'Goods vehicle' },
  { match: /אוטובוס|מיניבוס/, value: 1.60, label: 'Bus / minibus' },
  { match: /פרטי/, value: 1.00, label: 'Private passenger car' },
];

/** Ownership (בעלות) — leased and company cars carry a loading. */
export const OWNERSHIP_LOADINGS: { match: RegExp; value: number; label: string }[] = [
  { match: /השכרה|ליסינג/, value: 1.30, label: 'Leased / rental vehicle' },
  { match: /חברה|מסחרי/, value: 1.15, label: 'Company vehicle' },
  { match: /פרטי/, value: 1.00, label: 'Privately owned' },
];

/**
 * Region loading (מחוז מושב). The skill notes city of residence moves the premium
 * significantly — theft and claim frequency are highest in the Tel Aviv / Center
 * districts and lowest in the periphery.
 */
export const DISTRICT_LOADINGS: { match: RegExp; value: number; label: string }[] = [
  { match: /תל.?אביב/, value: 1.12, label: 'Tel Aviv district' },
  { match: /מרכז/, value: 1.07, label: 'Central district' },
  { match: /ירושלים/, value: 1.04, label: 'Jerusalem district' },
  { match: /חיפה/, value: 1.02, label: 'Haifa district' },
  { match: /צפון/, value: 0.97, label: 'Northern district' },
  { match: /דרום/, value: 0.95, label: 'Southern district' },
  { match: /יהודה|שומרון/, value: 0.98, label: 'Judea & Samaria district' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Product base rates
// ─────────────────────────────────────────────────────────────────────────────

export const HOVA = {
  /**
   * Regulated base tariff for a standard private car with a standard driver.
   * Calibrated so a standard profile reproduces the agency's existing ₪800 hova
   * baseline; every other profile moves off it through the bands below.
   */
  baseTariff: 800,
  /** Permitted insurer loading/discount band around the tariff — kept neutral by default. */
  insurerAdjustment: 1.0,
  min: 450,
  max: 4200,
};

export const THIRD_PARTY = {
  /** Calibrated so a standard profile lands on the agency's existing ₪1,100 baseline. */
  baseRate: 1180,
  min: 550,
  max: 6000,
};

export const COMPLIMENTARY = {
  /**
   * Annual premium as a share of the vehicle's estimated market value. Calibrated so
   * a standard profile lands on the agency's existing ₪1,000 baseline.
   */
  rateOfVehicleValue: 0.018,
  min: 700,
  max: 12000,
};

/**
 * Rough new-car price model for the Israeli market, used only to estimate the
 * vehicle's current market value for the complimentary (makif) rate. Israeli
 * list prices run high because of purchase tax, hence the generous base.
 */
export const VEHICLE_VALUE = {
  base: 55000,
  perCcOver1000: 45,
  perHorsePower: 220,
  /**
   * Annual depreciation per year of vehicle age. Israeli used cars hold value better
   * than most markets because purchase tax keeps replacement cost high.
   */
  annualDepreciation: 0.91,
  newMin: 60000,
  newMax: 450000,
  residualMin: 10000,
};

/** Fixed-price add-ons sold alongside the quote (mirrored in the UI and the PDF). */
export const ADDONS = {
  glassAndMore: 320,
  complementaryVip: 550,
};

/** Defaults used when the lead record is missing a rating field. */
export const FALLBACKS = {
  driverAge: 35,
  licenseYears: 10,
  engineCc: 1600,
  horsePower: 110,
  safetyLevel: 5,
  vehicleAgeYears: 6,
  claimFreeYears: 3,
};
