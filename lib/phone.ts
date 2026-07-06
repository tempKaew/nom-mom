/** Thai mobile: 10 digits starting with 0 (e.g. 0812345678). */
export function isValidThaiPhone(phone: string): boolean {
  return /^0\d{9}$/.test(phone);
}

/** Strip non-digits and cap at 10 characters. */
export function normalizePhoneInput(input: string): string {
  return input.replace(/\D/g, "").slice(0, 10);
}
