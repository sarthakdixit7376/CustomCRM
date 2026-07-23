/** Strips formatting and normalizes an Israeli local number (e.g. "052-1234567") to E.164 digits (e.g. "972521234567"). */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('0') ? digits.slice(1) : digits;
  return `972${local}`;
}

/**
 * Returns a wa.me deep link pre-filled with the pricing PDF URL, for the agent to send manually.
 * Swap-out point: once Twilio is connected, replace this call site with
 * `twilioClient.messages.create({ from: 'whatsapp:...', to: `whatsapp:+${toWhatsAppNumber(phone)}`, mediaUrl: [pdfUrl] })`
 * for a fully automated send.
 */
export function buildWhatsAppShareLink(phoneNumber: string, pdfUrl: string): string {
  const number = toWhatsAppNumber(phoneNumber);
  const message = `Here is your insurance quote: ${pdfUrl}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
