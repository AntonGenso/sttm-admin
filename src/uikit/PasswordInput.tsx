import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";

const EyeIcon = ({ crossed }: { crossed: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {crossed ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

// Text input that toggles between masked and plain text, so the user can check
// what they typed. Forwards the ref, which is what react-hook-form's
// `register()` needs to wire the field up.
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = "", ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const { t } = useTranslation();

    return (
      <div className="relative">
        <input
          ref={ref}
          type={isVisible ? "text" : "password"}
          className={`${className} pr-12`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={isVisible ? t("auth.hidePassword") : t("auth.showPassword")}
          aria-pressed={isVisible}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-cyan-bright/60 transition-colors hover:text-cyan-bright focus-visible:outline focus-visible:outline-1 focus-visible:outline-cyan-bright"
        >
          <EyeIcon crossed={isVisible} />
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
