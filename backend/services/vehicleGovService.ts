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
