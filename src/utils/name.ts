// Account names double as the login handle and as the display name. We allow
// latin and Cyrillic letters plus full names with internal separators (space,
// hyphen, apostrophe), so both "John Connor" and "Иван Петрович" are valid.
// Digits and other symbols are rejected. Mirrored server-side in
// sttm-server/src/utils/name.js — this is UX, the server is what protects the
// endpoint.
export const NAME_REGEX = /^[A-Za-zА-Яа-яЁё]+(?:[ '-][A-Za-zА-Яа-яЁё]+)*$/;

export const NAME_MIN_LENGTH = 3;

/**
 * react-hook-form `validate` rule: returns `true` when valid, otherwise the
 * i18n key of the message to show (the caller translates it, passing `{min}`).
 * The value is trimmed first so leading/trailing spaces never count toward the
 * length or trip the pattern.
 */
export const validateName = (value: string): string | true => {
  const trimmed = value.trim();
  if (trimmed.length < NAME_MIN_LENGTH) {
    return "validation.nameTooShort";
  }
  if (!NAME_REGEX.test(trimmed)) {
    return "validation.nameInvalid";
  }
  return true;
};
