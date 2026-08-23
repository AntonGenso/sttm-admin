export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt ignores anything past 72 bytes

export interface PasswordRule {
  id: string;
  /** i18n key for the requirements checklist under the field. */
  labelKey: string;
  /** i18n key for the full sentence shown as the field error. */
  messageKey: string;
  /** Hidden from the checklist when false — still enforced on submit. */
  showInChecklist?: boolean;
  test: (value: string) => boolean;
}

export const passwordRules: PasswordRule[] = [
  {
    id: "length",
    labelKey: "password.ruleLength",
    messageKey: "validation.pwLength",
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "maxLength",
    labelKey: "password.ruleMaxLength",
    messageKey: "validation.pwMaxLength",
    showInChecklist: false,
    test: (value) => value.length <= PASSWORD_MAX_LENGTH,
  },
  {
    id: "lowercase",
    labelKey: "password.ruleLowercase",
    messageKey: "validation.pwLowercase",
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: "uppercase",
    labelKey: "password.ruleUppercase",
    messageKey: "validation.pwUppercase",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "digit",
    labelKey: "password.ruleDigit",
    messageKey: "validation.pwDigit",
    test: (value) => /\d/.test(value),
  },
  {
    id: "whitespace",
    labelKey: "password.ruleWhitespace",
    messageKey: "validation.pwWhitespace",
    test: (value) => !/\s/.test(value),
  },
];

/**
 * react-hook-form validator: `true` when valid, otherwise the i18n key of the
 * failed rule's message. The caller translates it (with `{min, max}` params).
 */
export const validatePassword = (value: string): true | string => {
  const failed = passwordRules.find((rule) => !rule.test(value));
  return failed ? failed.messageKey : true;
};
