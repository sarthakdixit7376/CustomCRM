import puppeteer from 'puppeteer';

interface PricingLead {
  age?: string | null;
  yearOfLicenseIssued?: string | null;
  mandatoryPrice?: number | null;
  complimentaryPrice?: number | null;
}

const formatCurrency = (amount: number): string => `₪${amount.toLocaleString('en-US')}`;

const formatValidUntil = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
};

export function buildPricingHtml(lead: PricingLead): string {
  const mandatoryPrice = lead.mandatoryPrice ?? 0;
  const complimentaryPrice = lead.complimentaryPrice ?? 0;
  const totalPrice = mandatoryPrice + complimentaryPrice;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Insurance Quote Summary</title>

<style>
    body{
        font-family: Arial, Helvetica, sans-serif;
        background:#f5f5f5;
        padding:30px;
    }

    .table-container{
        max-width:700px;
        margin:auto;
        background:#fff;
        border-radius:8px;
        overflow:hidden;
        box-shadow:0 2px 8px rgba(0,0,0,0.08);
    }

    table{
        width:100%;
        border-collapse:collapse;
    }

    th{
        background:#1f2937;
        color:#fff;
        text-align:left;
        padding:14px 18px;
        font-size:18px;
    }

    td{
        padding:14px 18px;
        border-bottom:1px solid #e5e7eb;
        vertical-align:top;
    }

    td:first-child{
        width:45%;
        font-weight:600;
        color:#222;
    }

    td:last-child{
        color:#555;
    }

    tr:last-child td{
        border-bottom:none;
    }
</style>
</head>

<body>

<div class="table-container">

<table>

<thead>
<tr>
    <th>Item</th>
    <th>Details</th>
</tr>
</thead>

<tbody>

<tr>
    <td>Eligible Driver Age</td>
    <td>${lead.age ?? '—'}</td>
</tr>

<tr>
    <td>Driving Licence Seniority</td>
    <td>${lead.yearOfLicenseIssued ?? '—'}</td>
</tr>

<tr>
    <td>Mandatory Insurance (Hova)</td>
    <td>${formatCurrency(mandatoryPrice)}</td>
</tr>

<tr>
    <td>Mandatory Insurance Payment</td>
    <td>Visa, up to 10 installments</td>
</tr>

<tr>
    <td>Comprehensive Package</td>
    <td>${formatCurrency(complimentaryPrice)}</td>
</tr>

<tr>
    <td>Comprehensive Payment</td>
    <td>Visa, up to 6 installments</td>
</tr>

<tr>
    <td>Total Annual Price</td>
    <td><strong>${formatCurrency(totalPrice)}</strong></td>
</tr>

<tr>
    <td>Third-Party Coverage Limit</td>
    <td>₪500,000</td>
</tr>

<tr>
    <td>Accident Deductible</td>
    <td>₪1,250</td>
</tr>

<tr>
    <td>Towing Service</td>
    <td>Included</td>
</tr>

<tr>
    <td>Glass Coverage</td>
    <td>Included</td>
</tr>

<tr>
    <td>Replacement Vehicle</td>
    <td>Included in case of an accident</td>
</tr>

<tr>
    <td>Lights and Mirrors Coverage</td>
    <td>Up to ₪7,000</td>
</tr>

<tr>
    <td>Lights and Mirrors Deductible</td>
    <td>₪250 per accident</td>
</tr>

<tr>
    <td>Total-Loss Compensation</td>
    <td>85% of the vehicle value</td>
</tr>

<tr>
    <td>Theft Compensation</td>
    <td>75% of the vehicle value</td>
</tr>

<tr>
    <td>Offer Valid Until</td>
    <td>${formatValidUntil()}</td>
</tr>

</tbody>

</table>

</div>

</body>
</html>`;
}

export async function generatePricingPdfBuffer(lead: PricingLead): Promise<Buffer> {
  const html = buildPricingHtml(lead);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdfBytes = await page.pdf({ format: 'A4', printBackground: true });
    return Buffer.from(pdfBytes);
  } finally {
    await browser.close();
  }
}
