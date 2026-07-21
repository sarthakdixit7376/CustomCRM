import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Helper: coerce a value to string or undefined */
const str = (v: any): string | undefined =>
  v != null && v !== '' ? String(v) : undefined;

export const LeadModel = {
  getLeads: async (agentId?: string) => {
    return prisma.lead.findMany({
      where: agentId ? { agentId } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  getLeadById: async (id: string) => {
    return prisma.lead.findUnique({ where: { id } });
  },

  createLead: async (input: any, agentId: string) => {
    // Handle array payload — take first element
    const raw = Array.isArray(input) ? input[0] : input;

    // Flatten vehicle_gov_data into the top-level object
    const v = raw.vehicle_gov_data || {};
    const d = { ...raw, ...v };

    return prisma.lead.create({
      data: {
        leadName:             d.lead_name           || d.leadName,
        phoneNumber:          d.phone_number         || d.phoneNumber,
        pdfUrl:               d.pdfUrl,
        agentId,

        // Person-specific fields
        age:                  str(d.age),
        dateOfBirth:          str(d.date_of_birth    || d.dateOfBirth),
        cost:                 str(d.cost             || d.cost_nis),
        yearOfLicenseIssued:  str(d.year_of_license_issued || d.yearOfLicenseIssued || d.license_issue_year),

        // Vehicle info fields (snake_case from API → camelCase Prisma)
        misparRechev:         str(d.mispar_rechev         || d.misparRechev         || d.vehicle_number),
        tozeretCd:            str(d.tozeret_cd            || d.tozeretCd),
        sugDegem:             str(d.sug_degem             || d.sugDegem),
        tozeretNm:            str(d.tozeret_nm            || d.tozeretNm),
        degemCd:              str(d.degem_cd              || d.degemCd),
        shnatYitzur:          str(d.shnat_yitzur          || d.shnatYitzur),
        degemNm:              str(d.degem_nm              || d.degemNm),
        ramatGimur:           str(d.ramat_gimur           || d.ramatGimur),
        ramatEivzurBetihuti:  str(d.ramat_eivzur_betihuti || d.ramat_eivzur_betihuty || d.ramatEivzurBetihuti),
        kvutzatZihum:         str(d.kvutzat_zihum         || d.kvutzatZihum),
        tzevaCd:              str(d.tzeva_cd              || d.tzevaCd),
        tzevaRechev:          str(d.tzeva_rechev          || d.tzevaRechev),
        zmigKidmi:            str(d.zmig_kidmi            || d.zmigKidmi),
        zmigAhori:            str(d.zmig_ahori            || d.zmigAhori),
        sugDelekNm:           str(d.sug_delek_nm          || d.sugDelekNm),
        horaatRishum:         str(d.horaat_rishum         || d.horaatRishum),
        moedAliyaLakvish:     str(d.moed_aliya_lakvish    || d.moedAliyaLakvish),
        baalut:               str(d.baalut),
        misgeret:             str(d.misgeret),
        tozeretEretzNm:       str(d.tozeret_eretz_nm      || d.tozeretEretzNm),
        mishkalKolel:         str(d.mishkal_kolel          || d.mishkalKolel),
        nefahManoa:           str(d.nefah_manoa            || d.nefahManoa),
        kinuyMishari:         str(d.kinuy_mishari          || d.kinuyMishari),
        mivchanAcharonDt:     str(d.mivchan_acharon_dt     || d.mivchanAcharonDt),
        tokefDt:              str(d.tokef_dt               || d.tokefDt),
        taarichPkikaDt:       str(d.taarich_pkika_dt       || d.taarichPkikaDt),
        taarichPkiah:         str(d.taarich_pkiah          || d.taarichPkiah),
        kvuzatAgra:           str(d.kvuzat_agra            || d.kvuzatAgra),
        mahozMoshav:          str(d.mahoz_moshav           || d.mahozMoshav),
        sugRechevNm:          str(d.sug_rechev_nm          || d.sugRechevNm),
        degemManoa:           str(d.degem_manoa            || d.degemManoa),
        koachSus:             str(d.koach_sus              || d.koachSus),
        misparDlatot:         str(d.mispar_dlatot          || d.misparDlatot),
        misparMoshavim:       str(d.mispar_moshavim        || d.misparMoshavim),
      },
    });
  },

  deleteLead: async (id: string) => {
    try {
      await prisma.lead.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      // If it doesn't exist, prisma throws
      return null;
    }
  },
};

