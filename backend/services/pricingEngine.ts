const MANDATORY_PRICE = 800; // TODO: replace with a real pricing API call
const COMPLIMENTARY_PRICE = 1000;
const THIRD_PARTY_PRICE_OVER_24 = 1100;
const THIRD_PARTY_PRICE_24_OR_UNDER = 1500;

export async function fetchMandatoryPrice(): Promise<number> {
  return MANDATORY_PRICE;
}

export function computeThirdPartyPrice(age: number): number {
  return age > 24 ? THIRD_PARTY_PRICE_OVER_24 : THIRD_PARTY_PRICE_24_OR_UNDER;
}

export function computeComplimentaryPrice(): number {
  return COMPLIMENTARY_PRICE;
}

export interface InsuranceQuote {
  mandatoryPrice: number;
  thirdPartyPrice: number;
  complimentaryPrice: number;
}

export async function generateInsuranceQuote(age: number): Promise<InsuranceQuote> {
  return {
    mandatoryPrice: await fetchMandatoryPrice(),
    thirdPartyPrice: computeThirdPartyPrice(age),
    complimentaryPrice: computeComplimentaryPrice(),
  };
}
