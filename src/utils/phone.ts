export const PHONE_PLACEHOLDER = "+998(99)9999999";

/** Country code + 2-digit operator code + 7 digits, e.g. +998(90)1234567. */
const NATIONAL_LENGTH = 9;
const COUNTRY_CODE = "998";

/** Always kept in the field, so the user only ever types the national part. */
export const PHONE_PREFIX = `+${COUNTRY_CODE}(`;

const PHONE_ERROR = `Enter a valid phone number in the ${PHONE_PLACEHOLDER} format`;

/**
 * Digits of the national part.
 *
 * The `+998` the mask always prints is dropped first, so what is left is what
 * the user actually typed. A national number may legitimately start with 998
 * itself (99 8xxxxxx), so the country code is only stripped again once the
 * national part overflows — that is when the user typed or pasted it too.
 */
const toNationalDigits = (value: string): string => {
  const trimmed = value.trim();
  const withoutPrefix = trimmed.startsWith(`+${COUNTRY_CODE}`)
    ? trimmed.slice(COUNTRY_CODE.length + 1)
    : trimmed;

  const digits = withoutPrefix.replace(/\D/g, "");

  return digits.length > NATIONAL_LENGTH && digits.startsWith(COUNTRY_CODE)
    ? digits.slice(COUNTRY_CODE.length)
    : digits;
};

/** Re-formats the field while the user types: `901234567` → `+998(90)1234567`. */
export const formatPhoneInput = (value: string): string => {
  // A second `+` means an international number was pasted over the prefix.
  // Leave it as typed — silently relabelling a foreign number as uzbek would
  // be worse than showing a validation error.
  if (value.trim().lastIndexOf("+") > 0) {
    return value;
  }

  const digits = toNationalDigits(value).slice(0, NATIONAL_LENGTH);
  const operatorCode = digits.slice(0, 2);
  const rest = digits.slice(2);

  return operatorCode.length === 2
    ? `${PHONE_PREFIX}${operatorCode})${rest}`
    : `${PHONE_PREFIX}${operatorCode}`;
};

/**
 * Brings user input to E.164 (`+998901234567`) so the same number typed as
 * `+998(90)1234567`, `901234567` or `+998 90 123 45 67` is stored one way.
 * Returns null when the value is not a complete uzbek number — foreign numbers
 * are rejected rather than truncated to nine digits.
 */
export const normalizePhone = (value: string): string | null => {
  const digits = toNationalDigits(value);
  return digits.length === NATIONAL_LENGTH ? `+${COUNTRY_CODE}${digits}` : null;
};

/** react-hook-form validator: `true` when valid, otherwise the error message. */
export const validatePhone = (value: string): true | string => {
  if (!toNationalDigits(value)) {
    return "Phone is required";
  }
  return normalizePhone(value) ? true : PHONE_ERROR;
};
