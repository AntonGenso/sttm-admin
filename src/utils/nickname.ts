// Mirrors sttm-server `src/utils/nickname.js` — game nicknames double as the
// login handle: latin and Cyrillic letters, digits and underscore, plus single
// spaces between words so a full name ("Иван Петров") is a valid nickname.
// This copy is UX; the server is what protects the endpoint.
import { containsProfanity } from "./profanity";

const NICKNAME_WORD = "[A-Za-z\\u0400-\\u04FF0-9_]+";
export const NICKNAME_REGEX = new RegExp(
  `^${NICKNAME_WORD}(?: ${NICKNAME_WORD})*$`,
);

export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 32;

/**
 * react-hook-form `validate` rule: `true` when valid, otherwise the i18n key of
 * the message to show (the caller translates it, passing `{min}` and `{max}`).
 */
export const validateNickname = (value: string): string | true => {
  const trimmed = value.trim();
  if (
    trimmed.length < NICKNAME_MIN_LENGTH ||
    trimmed.length > NICKNAME_MAX_LENGTH ||
    !NICKNAME_REGEX.test(trimmed)
  ) {
    return "validation.nicknameInvalid";
  }
  if (containsProfanity(trimmed)) {
    return "validation.nameProfanity";
  }
  return true;
};
