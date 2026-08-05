export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt ignores anything past 72 bytes

export interface PasswordRule {
  id: string;
  /** Short form for the requirements checklist under the field. */
  label: string;
  /** Full sentence shown as the field error. */
  message: string;
  /** Hidden from the checklist when false — still enforced on submit. */
  showInChecklist?: boolean;
  test: (value: string) => boolean;
}

export const passwordRules: PasswordRule[] = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "maxLength",
    label: `No more than ${PASSWORD_MAX_LENGTH} characters`,
    message: `Password must be at most ${PASSWORD_MAX_LENGTH} characters long`,
    showInChecklist: false,
    test: (value) => value.length <= PASSWORD_MAX_LENGTH,
  },
  {
    id: "lowercase",
    label: "A lowercase letter",
    message: "Password must contain a lowercase letter",
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: "uppercase",
    label: "An uppercase letter",
    message: "Password must contain an uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "digit",
    label: "A digit",
    message: "Password must contain a digit",
    test: (value) => /\d/.test(value),
  },
  {
    id: "whitespace",
    label: "No spaces",
    message: "Password must not contain spaces",
    test: (value) => !/\s/.test(value),
  },
];

/** react-hook-form validator: `true` when valid, otherwise the error message. */
export const validatePassword = (value: string): true | string => {
  const failed = passwordRules.find((rule) => !rule.test(value));
  return failed ? failed.message : true;
};
