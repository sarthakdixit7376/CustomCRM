/**
 * Israeli motor-insurance quote engine.
 *
 * Implements the rating methodology described by the "israeli-insurance-comparator"
 * skill (agentskills.co.il / skills-il/tax-and-finance) against the data we already
 * hold on a lead: the driver details the agent captured plus the vehicle record
 * pulled from the Israeli gov registry (data.gov.il) by `vehicleGovService`.
 *
 *   hova (mandatory)   → regulated tariff × driver band × vehicle band
 *   tzad gimel (3rd party) → market base × driver band × vehicle band × region
 *   makif (complimentary)  → estimated vehicle market value × rate × risk
 *
 * The numbers this produces are AGENCY ESTIMATES, priced off the tables in
 * `israeliInsuranceRates.ts`. They are not live carrier quotes: the platforms the
 * skill points at (car.cma.gov.il, hova.co.il, Shukabit, Wobi, Bestie) all require
 * the lead's teudat zehut and an interactive session, so they cannot be quoted
 * server-side. Every quote therefore carries `sources` so the agent can verify the
 * final price before binding.
 */

import {
  AGE_BANDS,
  ADDONS,
  CLAIM_FREE_BANDS,
  COMPLIMENTARY,
  DISTRICT_LOADINGS,
  ENGINE_CC_BANDS,
  FALLBACKS,
  HOVA,
  LICENSE_SENIORITY_BANDS,
  OWNERSHIP_LOADINGS,
  SAFETY_LEVEL_BANDS,
  THIRD_PARTY,
  VEHICLE_TYPE_LOADINGS,
  VEHICLE_VALUE,
  pickBand,
  roundShekel,
} from './israeliInsuranceRates.js';

export { ADDONS };

/** Anything with the lead/vehicle fields we rate on — a Prisma Lead row or a raw payload. */
export interface QuoteProfileInput {
  age?: string | number | null;
  dateOfBirth?: string | null;
  yearOfLicenseIssued?: string | number | null;
  claimFreeYears?: string | number | null;
  shnatYitzur?: string | null;
  nefahManoa?: string | null;
  koachSus?: string | null;
  ramatEivzurBetihuti?: string | null;
  sugRechevNm?: string | null;
  baalut?: string | null;
  mahozMoshav?: string | null;
  [key: string]: any;
}

export interface QuoteProfile {
  driverAge: number;
  licenseYears: number;
  claimFreeYears: number;
  vehicleAgeYears: number;
  engineCc: number;
  horsePower: number;
  safetyLevel: number;
  vehicleType?: string;
  ownership?: string;
  district?: string;
  /** Rating fields that were missing on the lead and had to be defaulted. */
  assumed: string[];
}

export interface QuoteFactor {
  label: string;
  multiplier: number;
}

export interface QuoteLine {
  price: number;
  base: number;
  factors: QuoteFactor[];
}

export interface InsuranceQuote {
  mandatoryPrice: number;
  thirdPartyPrice: number;
  complimentaryPrice: number;
  estimatedVehicleValue: number;
  profile: QuoteProfile;
  breakdown: {
    mandatory: QuoteLine;
    thirdParty: QuoteLine;
    complimentary: QuoteLine;
  };
  /** Where the agent should verify the estimate before binding. */
  sources: string[];
}

/** Cost-price floors (from the Cost Price page) so a quote never lands below cost. */
export interface QuoteFloors {
  mandatory?: number;
  thirdParty?: number;
  complimentary?: number;
}

const VERIFICATION_SOURCES = [
  'car.cma.gov.il — official CMA hova tariff calculator',
  'hova.co.il — live mandatory quotes by plate + ID',
  'shukabit.co.il / wobi.co.il — makif and third-party market comparison',
];

const num = (v: unknown): number | undefined => {
  if (v == null || v === '') return undefined;
  const n = Number(String(v).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
};

const currentYear = () => new Date().getFullYear();

/** Age from a date of birth, tolerating the several formats the intake payloads use. */
const ageFromDateOfBirth = (dob?: string | null): number | undefined => {
  if (!dob) return undefined;
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return undefined;
  const age = (Date.now() - parsed.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return age > 15 && age < 110 ? Math.floor(age) : undefined;
};

/** Maps a lead row (or a raw intake payload) onto the fields the rate tables need. */
export function buildQuoteProfile(input: QuoteProfileInput = {}): QuoteProfile {
  const assumed: string[] = [];

  const driverAge = num(input.age) ?? ageFromDateOfBirth(input.dateOfBirth ?? null);
  if (driverAge == null) assumed.push('driver age');

  const licenseYear = num(input.yearOfLicenseIssued);
  const licenseYears = licenseYear != null && licenseYear > 1900
    ? Math.max(0, currentYear() - licenseYear)
    : undefined;
  if (licenseYears == null) assumed.push('license seniority');

  const vehicleYear = num(input.shnatYitzur);
  const vehicleAgeYears = vehicleYear != null && vehicleYear > 1900
    ? Math.max(0, currentYear() - vehicleYear)
    : undefined;
  if (vehicleAgeYears == null) assumed.push('vehicle year');

  const engineCc = num(input.nefahManoa);
  if (engineCc == null) assumed.push('engine size');

  const horsePower = num(input.koachSus);
  if (horsePower == null) assumed.push('horsepower');

  const safetyLevel = num(input.ramatEivzurBetihuti);
  if (safetyLevel == null) assumed.push('safety equipment level');

  const claimFreeYears = num(input.claimFreeYears);
  if (claimFreeYears == null) assumed.push('claim-free years');

  return {
    driverAge: driverAge ?? FALLBACKS.driverAge,
    licenseYears: licenseYears ?? FALLBACKS.licenseYears,
    claimFreeYears: claimFreeYears ?? FALLBACKS.claimFreeYears,
    vehicleAgeYears: vehicleAgeYears ?? FALLBACKS.vehicleAgeYears,
    engineCc: engineCc ?? FALLBACKS.engineCc,
    horsePower: horsePower ?? FALLBACKS.horsePower,
    safetyLevel: safetyLevel ?? FALLBACKS.safetyLevel,
    vehicleType: input.sugRechevNm ?? undefined,
    ownership: input.baalut ?? undefined,
    district: input.mahozMoshav ?? undefined,
    assumed,
  };
}

const matchLoading = (
  table: { match: RegExp; value: number; label: string }[],
  text?: string
): QuoteFactor | undefined => {
  if (!text) return undefined;
  const hit = table.find((row) => row.match.test(text));
  return hit ? { label: hit.label, multiplier: hit.value } : undefined;
};

const bandFactor = (bands: Parameters<typeof pickBand<number>>[0], value: number): QuoteFactor => {
  const band = pickBand(bands, value);
  return { label: band.label, multiplier: band.value };
};

const applyFactors = (base: number, factors: QuoteFactor[]): number =>
  factors.reduce((total, f) => total * f.multiplier, base);

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

/** Estimated current market value of the vehicle, used to rate the makif cover. */
export function estimateVehicleValue(profile: QuoteProfile): number {
  const newValue = clamp(
    VEHICLE_VALUE.base +
      Math.max(0, profile.engineCc - 1000) * VEHICLE_VALUE.perCcOver1000 +
      profile.horsePower * VEHICLE_VALUE.perHorsePower,
    VEHICLE_VALUE.newMin,
    VEHICLE_VALUE.newMax
  );

  const depreciated = newValue * Math.pow(VEHICLE_VALUE.annualDepreciation, profile.vehicleAgeYears);
  return Math.round(Math.max(depreciated, VEHICLE_VALUE.residualMin));
}

/**
 * Bituach hova. Regulated tariff, so only the driver/vehicle risk band moves it —
 * no region or claims loading, which the tariff does not recognise.
 */
export function quoteMandatory(profile: QuoteProfile, floor?: number): QuoteLine {
  const factors: QuoteFactor[] = [
    bandFactor(AGE_BANDS, profile.driverAge),
    bandFactor(LICENSE_SENIORITY_BANDS, profile.licenseYears),
    bandFactor(ENGINE_CC_BANDS, profile.engineCc),
  ];

  const typeFactor = matchLoading(VEHICLE_TYPE_LOADINGS, profile.vehicleType);
  if (typeFactor) factors.push(typeFactor);

  if (HOVA.insurerAdjustment !== 1) {
    factors.push({ label: 'Insurer permitted adjustment', multiplier: HOVA.insurerAdjustment });
  }

  const raw = clamp(applyFactors(HOVA.baseTariff, factors), HOVA.min, HOVA.max);
  return { price: roundShekel(Math.max(raw, floor ?? 0)), base: HOVA.baseTariff, factors };
}

/** Bituach tzad gimel. Fully market priced, so region and claims history both count. */
export function quoteThirdParty(profile: QuoteProfile, floor?: number): QuoteLine {
  const factors: QuoteFactor[] = [
    bandFactor(AGE_BANDS, profile.driverAge),
    bandFactor(LICENSE_SENIORITY_BANDS, profile.licenseYears),
    bandFactor(CLAIM_FREE_BANDS, profile.claimFreeYears),
    bandFactor(ENGINE_CC_BANDS, profile.engineCc),
    bandFactor(SAFETY_LEVEL_BANDS, profile.safetyLevel),
  ];

  for (const factor of [
    matchLoading(VEHICLE_TYPE_LOADINGS, profile.vehicleType),
    matchLoading(OWNERSHIP_LOADINGS, profile.ownership),
    matchLoading(DISTRICT_LOADINGS, profile.district),
  ]) {
    if (factor) factors.push(factor);
  }

  const raw = clamp(applyFactors(THIRD_PARTY.baseRate, factors), THIRD_PARTY.min, THIRD_PARTY.max);
  return { price: roundShekel(Math.max(raw, floor ?? 0)), base: THIRD_PARTY.baseRate, factors };
}

/** Makif / complimentary cover, rated off the vehicle's estimated market value. */
export function quoteComplimentary(profile: QuoteProfile, floor?: number): QuoteLine {
  const vehicleValue = estimateVehicleValue(profile);
  const base = vehicleValue * COMPLIMENTARY.rateOfVehicleValue;

  const factors: QuoteFactor[] = [
    bandFactor(AGE_BANDS, profile.driverAge),
    bandFactor(CLAIM_FREE_BANDS, profile.claimFreeYears),
    bandFactor(SAFETY_LEVEL_BANDS, profile.safetyLevel),
  ];

  for (const factor of [
    matchLoading(OWNERSHIP_LOADINGS, profile.ownership),
    matchLoading(DISTRICT_LOADINGS, profile.district),
  ]) {
    if (factor) factors.push(factor);
  }

  const raw = clamp(applyFactors(base, factors), COMPLIMENTARY.min, COMPLIMENTARY.max);
  return { price: roundShekel(Math.max(raw, floor ?? 0)), base: Math.round(base), factors };
}

/** Prices all three motor products for one lead. */
export function generateInsuranceQuote(
  input: QuoteProfileInput | QuoteProfile,
  floors: QuoteFloors = {}
): InsuranceQuote {
  const profile = 'assumed' in input ? (input as QuoteProfile) : buildQuoteProfile(input);

  const mandatory = quoteMandatory(profile, floors.mandatory);
  const thirdParty = quoteThirdParty(profile, floors.thirdParty);
  const complimentary = quoteComplimentary(profile, floors.complimentary);

  return {
    mandatoryPrice: mandatory.price,
    thirdPartyPrice: thirdParty.price,
    complimentaryPrice: complimentary.price,
    estimatedVehicleValue: estimateVehicleValue(profile),
    profile,
    breakdown: { mandatory, thirdParty, complimentary },
    sources: VERIFICATION_SOURCES,
  };
}
