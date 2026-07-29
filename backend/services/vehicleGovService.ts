const GOV_RESOURCE_ID = '053cea08-09bc-40ec-8f7a-156f0677aff3';

/** Looks up a vehicle in the Israeli government vehicle registry by its plate number. */
export async function fetchVehicleGovData(vehicleNumber: string | number): Promise<Record<string, any>> {
  try {
    const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${GOV_RESOURCE_ID}&filters=${encodeURIComponent(JSON.stringify({ mispar_rechev: Number(vehicleNumber) }))}&limit=1`;
    const response = await fetch(url);
    if (!response.ok) return {};

    const json: any = await response.json();
    const records = json?.result?.records;
    return records && records.length > 0 ? records[0] : {};
  } catch (error) {
    console.warn('Could not fetch vehicle data from gov API:', error);
    return {};
  }
}

const str = (v: any): string | undefined =>
  v != null && v !== '' ? String(v) : undefined;

/** Maps a raw gov API vehicle record (snake_case) onto the camelCase Prisma vehicle fields shared by Lead and Customer. */
export function mapVehicleGovFields(d: Record<string, any>) {
  return {
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
  };
}
