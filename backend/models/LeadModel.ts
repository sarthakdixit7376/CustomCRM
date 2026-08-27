import prisma from '../config/prisma.js';
import { generateInsuranceQuote, buildQuoteProfile, type QuoteFloors } from '../services/pricingEngine.js';
import { compareLiveHova, type LiveHovaComparison } from '../services/liveHovaComparison.js';
import {
  getCachedLiveComparisons,
  saveLiveComparison,
  clearCachedLiveComparison,
  markCmaBlocked,
  cmaBlockCooldownMinutes,
} from '../services/liveHovaCache.js';
import { fetchVehicleGovData, mapVehicleGovFields } from '../services/vehicleGovService.js';

/** Helper: coerce a value to string or undefined */
const str = (v: any): string | undefined =>
  v != null && v !== '' ? String(v) : undefined;

export const LeadModel = {
  /**
   * Cost prices act as a floor on generated quotes so the engine can never price a
   * lead below what the policy costs the agency. Missing categories mean no floor.
   */
  getQuoteFloors: async (): Promise<QuoteFloors> => {
    const rows = await prisma.insuranceCostPrice.findMany();
    const byCategory = Object.fromEntries(rows.map((r) => [r.category, r.costPrice]));
    return {
      mandatory: byCategory.MANDATORY,
      thirdParty: byCategory.THIRD_PARTY,
      complimentary: byCategory.COMPLIMENTARY,
    };
  },

  /**
   * Re-prices an existing lead from its current driver + vehicle data and saves the
   * result. `onlyMissing` fills blank price columns without touching prices an agent
   * has already negotiated by hand.
   *
   * When `live` is true (manual Re-price), hits car.cma.gov.il for live hova insurer
   * quotes and prefers the cheapest CMA premium for mandatoryPrice.
   * Makif / tzad-gimel always stay on the local engine.
   */
  autoQuoteLead: async (
    id: string,
    options: { onlyMissing?: boolean; claimFreeYears?: number; live?: boolean } = {}
  ) => {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return null;

    const profile = buildQuoteProfile({
      ...lead,
      claimFreeYears: options.claimFreeYears ?? undefined,
    });
    const quote = generateInsuranceQuote(profile, await LeadModel.getQuoteFloors());

    let liveComparison: LiveHovaComparison | undefined;
    if (options.live) {
      // car.cma.gov.il blocks automated sessions at its WAF. Once it has, every further
      // attempt burns the full ~55s budget to fail identically — so during the back-off
      // window skip the scrape entirely and return the local estimate immediately.
      const cooldownMinutes = await cmaBlockCooldownMinutes();
      if (cooldownMinutes > 0) {
        liveComparison = {
          cma: {
            source: 'cma',
            status: 'skipped',
            error:
              `CMA blocked the automated check. Pausing live lookups for ${cooldownMinutes} more minute(s). ` +
              `Prices below are the local estimate — open car.cma.gov.il to confirm the mandatory premium.`,
            quotes: [],
            url: 'https://car.cma.gov.il/',
            fetchedAt: new Date().toISOString(),
          },
        };
        return { lead: await LeadModel.applyQuote(id, lead, quote, options.onlyMissing), quote, liveComparison };
      }

      try {
        liveComparison = await compareLiveHova({
          ...lead,
          claimFreeYears: options.claimFreeYears ?? undefined,
        });
        if (liveComparison.recommendedMandatoryPrice != null) {
          const floors = await LeadModel.getQuoteFloors();
          const floor = floors.mandatory ?? 0;
          quote.mandatoryPrice = Math.max(liveComparison.recommendedMandatoryPrice, floor);
          quote.breakdown.mandatory = {
            ...quote.breakdown.mandatory,
            price: quote.mandatoryPrice,
            base: liveComparison.recommendedMandatoryPrice,
            factors: [
              {
                label: 'Live CMA cheapest insurer',
                multiplier: 1,
              },
            ],
          };
          quote.sources = [
            ...(liveComparison.cma.status === 'ok' ? ['car.cma.gov.il — live tariff comparison'] : []),
            ...quote.sources,
          ];
        }
        // Persist so the next page load can show this result instantly instead of
        // re-running a ~60s Puppeteer scrape just to redisplay what was already fetched.
        await saveLiveComparison(id, liveComparison);
        // Start the back-off window so the next click doesn't burn another minute.
        if (liveComparison.cma.status === 'error') await markCmaBlocked();
      } catch (error) {
        console.warn('Live CMA comparison failed; keeping engine estimate:', error);
        await markCmaBlocked();
        liveComparison = undefined;
      }
    }

    return { lead: await LeadModel.applyQuote(id, lead, quote, options.onlyMissing), quote, liveComparison };
  },

  /** Writes the priced columns back, honouring `onlyMissing` (never overwrite a hand-set price). */
  applyQuote: async (id: string, lead: any, quote: { mandatoryPrice: number; thirdPartyPrice: number; complimentaryPrice: number }, onlyMissing?: boolean) => {
    const data: Record<string, number> = {};
    if (!onlyMissing || lead.mandatoryPrice == null) data.mandatoryPrice = quote.mandatoryPrice;
    if (!onlyMissing || lead.thirdPartyPrice == null) data.thirdPartyPrice = quote.thirdPartyPrice;
    if (!onlyMissing || lead.complimentaryPrice == null) data.complimentaryPrice = quote.complimentaryPrice;

    return Object.keys(data).length > 0
      ? prisma.lead.update({ where: { id }, data })
      : lead;
  },

  getLeads: async (agentId?: string) => {
    return prisma.lead.findMany({
      where: agentId ? { agentId } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        agent: { select: { id: true, name: true, email: true } },
      },
    });
  },

  /** Cached live CMA comparisons for the given leads — instant, no scrape. */
  getLiveComparisons: async (agentId?: string) => {
    const leads = await prisma.lead.findMany({
      where: agentId ? { agentId } : undefined,
      select: { id: true },
    });
    const cached = await getCachedLiveComparisons(leads.map((l) => l.id));
    return Object.fromEntries(
      Object.entries(cached).map(([leadId, entry]) => [leadId, { ...entry.comparison, fetchedAt: entry.fetchedAt }])
    );
  },

  getLeadById: async (id: string) => {
    return prisma.lead.findUnique({
      where: { id },
      include: {
        agent: { select: { id: true, name: true, email: true } },
      },
    });
  },

  createLead: async (input: any, agentId: string) => {
    // Handle array payload — take first element
    const raw = Array.isArray(input) ? input[0] : input;

    // Look up the vehicle in the Israeli gov registry server-side (avoids exposing our auth token to a third-party domain)
    const vehicleNumber = raw.vehicle_number || raw.misparRechev || raw.mispar_rechev;
    const v = vehicleNumber ? await fetchVehicleGovData(vehicleNumber) : {};
    const d = { ...raw, ...v };

    const quote = generateInsuranceQuote(buildQuoteProfile(d), await LeadModel.getQuoteFloors());

    const leadNationalIdRaw = d.lead_national_id ?? d.leadNationalId;
    const leadNationalId = leadNationalIdRaw != null && leadNationalIdRaw !== '' ? Number(leadNationalIdRaw) : undefined;

    const created = await prisma.lead.create({
      data: {
        leadNationalId,
        leadName:             d.lead_name           || d.leadName,
        phoneNumber:          d.phone_number         || d.phoneNumber,
        pdfUrl:               d.pdfUrl,
        agentId,

        // Person-specific fields
        age:                  str(d.age),
        dateOfBirth:          str(d.date_of_birth    || d.dateOfBirth),
        cost:                 str(d.cost             || d.cost_nis),
        yearOfLicenseIssued:  str(d.year_of_license_issued || d.yearOfLicenseIssued || d.license_issue_year),
        interestedIn:         (d.interested_in || d.interestedIn || undefined) as any,

        // Insurance quote pricing
        mandatoryPrice:       quote.mandatoryPrice,
        thirdPartyPrice:      quote.thirdPartyPrice,
        complimentaryPrice:   quote.complimentaryPrice,

        // Vehicle info fields (snake_case from API → camelCase Prisma)
        ...mapVehicleGovFields(d),
      },
    });

    return created;
  },

  deleteLead: async (id: string) => {
    try {
      await prisma.lead.delete({
        where: { id },
      });
      await clearCachedLiveComparison(id);
      return true;
    } catch (error) {
      // If it doesn't exist, prisma throws
      return null;
    }
  },

  updateLeadFlowStatus: async (id: string, leadFlowStatus: any, userId?: string, note?: string) => {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.lead.findUnique({ where: { id } });
      if (!existing) throw new Error('Lead not found');

      const updated = await tx.lead.update({
        where: { id },
        data: { leadFlowStatus },
      });

      await tx.leadFlowStatusLog.create({
        data: {
          leadId: id,
          fromStatus: existing.leadFlowStatus,
          toStatus: leadFlowStatus,
          changedBy: userId,
          note,
        },
      });

      return updated;
    });
  },

  updateLeadAgent: async (id: string, agentId: string) => {
    return prisma.lead.update({
      where: { id },
      data: { agentId },
      include: {
        agent: { select: { id: true, name: true, email: true } },
      },
    });
  },

  updateLeadQuote: async (
    id: string,
    data: {
      mandatoryPrice?: number;
      thirdPartyPrice?: number;
      complimentaryPrice?: number;
      glassAndMoreSelected?: boolean;
      complementaryVipSelected?: boolean;
    }
  ) => {
    return prisma.lead.update({
      where: { id },
      data,
    });
  },

  updateLeadPricingPdfUrl: async (id: string, pricingPdfUrl: string) => {
    return prisma.lead.update({
      where: { id },
      data: { pricingPdfUrl },
    });
  },

  convertToCustomer: async (
    leadId: string,
    policyData: {
      policyNumber: string;
      policyType: string;
      type?: string | null;
      insuranceCompany: string;
      startDate?: string | null;
      endDate?: string | null;
      gender?: string | null;
      agentName?: string | null;
      purchaseType?: string | null;
      email?: string | null;
    }
  ) => {
    return prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id: leadId } });
      if (!lead) throw new Error('Lead not found');

      const costPrices = await tx.insuranceCostPrice.findMany();
      const costByCategory: Record<string, number> = Object.fromEntries(
        costPrices.map((c) => [c.category, c.costPrice])
      );

      const customer = await tx.customer.create({
        data: {
          customerNationalId: lead.leadNationalId,
          customerName: lead.leadName,
          idNumber: lead.idNumber,
          dateOfBirth: lead.dateOfBirth,
          agentId: lead.agentId,
          creditedAgentId: lead.agentId,
          convertedFromLead: true,

          gender:       policyData.gender || null,
          agentName:    policyData.agentName || null,
          purchaseType: policyData.purchaseType || null,
          email:        policyData.email || null,

          phoneNumber:          lead.phoneNumber,
          age:                  lead.age,
          cost:                 lead.cost,
          yearOfLicenseIssued:  lead.yearOfLicenseIssued,
          interestedIn:         lead.interestedIn,

          mandatoryPrice:       lead.mandatoryPrice,
          thirdPartyPrice:      lead.thirdPartyPrice,
          complimentaryPrice:   lead.complimentaryPrice,

          // Snapshot today's cost price per category so later edits to the global cost
          // price setting never retroactively change this customer's recorded profit.
          mandatoryCostPrice:     lead.mandatoryPrice != null ? costByCategory.MANDATORY ?? 0 : null,
          thirdPartyCostPrice:    lead.thirdPartyPrice != null ? costByCategory.THIRD_PARTY ?? 0 : null,
          complimentaryCostPrice: lead.complimentaryPrice != null ? costByCategory.COMPLIMENTARY ?? 0 : null,

          glassAndMoreSelected:     lead.glassAndMoreSelected,
          complementaryVipSelected: lead.complementaryVipSelected,

          contacts: lead.phoneNumber
            ? { create: [{ type: 'mobile', value: lead.phoneNumber, label: 'Mobile', icon: 'phone' }] }
            : undefined,
        },
      });

      // The lead represents (at most) one car pre-conversion; carry it over into its own Vehicle row.
      let vehicle = null;
      if (lead.misparRechev) {
        vehicle = await tx.vehicle.create({
          data: {
            customerId:           customer.id,
            misparRechev:         lead.misparRechev,
            tozeretCd:            lead.tozeretCd,
            sugDegem:             lead.sugDegem,
            tozeretNm:            lead.tozeretNm,
            degemCd:              lead.degemCd,
            shnatYitzur:          lead.shnatYitzur,
            degemNm:              lead.degemNm,
            ramatGimur:           lead.ramatGimur,
            ramatEivzurBetihuti:  lead.ramatEivzurBetihuti,
            kvutzatZihum:         lead.kvutzatZihum,
            tzevaCd:              lead.tzevaCd,
            tzevaRechev:          lead.tzevaRechev,
            zmigKidmi:            lead.zmigKidmi,
            zmigAhori:            lead.zmigAhori,
            sugDelekNm:           lead.sugDelekNm,
            horaatRishum:         lead.horaatRishum,
            moedAliyaLakvish:     lead.moedAliyaLakvish,
            baalut:               lead.baalut,
            misgeret:             lead.misgeret,
            tozeretEretzNm:       lead.tozeretEretzNm,
            mishkalKolel:         lead.mishkalKolel,
            nefahManoa:           lead.nefahManoa,
            kinuyMishari:         lead.kinuyMishari,
            mivchanAcharonDt:     lead.mivchanAcharonDt,
            tokefDt:              lead.tokefDt,
            taarichPkikaDt:       lead.taarichPkikaDt,
            taarichPkiah:         lead.taarichPkiah,
            kvuzatAgra:           lead.kvuzatAgra,
            mahozMoshav:          lead.mahozMoshav,
            sugRechevNm:          lead.sugRechevNm,
            degemManoa:           lead.degemManoa,
            koachSus:             lead.koachSus,
            misparDlatot:         lead.misparDlatot,
            misparMoshavim:       lead.misparMoshavim,
          },
        });
      }

      await tx.policy.create({
        data: {
          policyNumber:     policyData.policyNumber,
          policyType:       policyData.policyType,
          type:             policyData.type || null,
          insuranceCompany: policyData.insuranceCompany,
          carId:            policyData.policyType === 'Car' ? vehicle?.id ?? null : null,
          carNumber:        policyData.policyType === 'Car' ? vehicle?.misparRechev ?? null : null,
          manufacturer:     policyData.policyType === 'Car' ? vehicle?.tozeretNm ?? null : null,
          startDate:        policyData.startDate ? new Date(policyData.startDate) : null,
          endDate:          policyData.endDate ? new Date(policyData.endDate) : null,
          status:           'Active',
          customerId:       customer.id,
        },
      });

      await tx.lead.delete({ where: { id: leadId } });

      return tx.customer.findUnique({
        where: { id: customer.id },
        include: { contacts: true, policies: true, vehicles: true },
      });
    });
  },
};

